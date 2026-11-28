import { prisma } from "../../config/database.js";
import type { Prisma } from "../../../generated/prisma/client.js";
import { AppError } from "../../shared/errors/app-error.js";

const STRIPE_RESERVATION_MINUTES = 30;

// COD reservations are released explicitly by the order lifecycle.
const COD_RESERVATION_EXPIRY = new Date("9999-12-31T23:59:59.999Z");

type ReservationItem = {
  variantId: string;
  quantity: number;
};

function aggregateItems(items: ReservationItem[]) {
  const quantities = new Map<string, number>();

  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      throw new AppError(
        400,
        "Reservation quantities must be positive integers",
        "INVALID_RESERVATION_QUANTITY",
      );
    }

    quantities.set(
      item.variantId,
      (quantities.get(item.variantId) ?? 0) + item.quantity,
    );
  }

  return [...quantities.entries()]
    .map(([variantId, quantity]) => ({ variantId, quantity }))
    .sort((a, b) => a.variantId.localeCompare(b.variantId));
}


/**
 * Reserves stock using a caller-provided transaction.
 * The order must already have exactly one payment record.
 */
export async function reserveOrderStockInTransaction(
  tx: Prisma.TransactionClient,
  orderId: string,
) {
  await tx.$queryRaw`
    SELECT "id"
    FROM "Order"
    WHERE "id" = ${orderId}
    FOR UPDATE
  `;

  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      payments: true,
      reservations: true,
    },
  });

  if (!order) {
    throw new AppError(404, "Order not found", "ORDER_NOT_FOUND");
  }

  if (order.status !== "PENDING") {
    throw new AppError(
      409,
      "Only pending orders can reserve stock",
      "ORDER_NOT_PENDING",
    );
  }

  if (order.payments.length !== 1) {
    throw new AppError(
      409,
      "Order must have exactly one payment record before reserving stock",
      "INVALID_PAYMENT_CONFIGURATION",
    );
  }

  const payment = order.payments[0];

  if (
    payment.provider === "STRIPE" &&
    !["PENDING", "PROCESSING"].includes(payment.status)
  ) {
    throw new AppError(
      409,
      "Stripe payment is not in a reservable state",
      "PAYMENT_NOT_RESERVABLE",
    );
  }

  if (payment.provider === "COD" && payment.status !== "PENDING") {
    throw new AppError(
      409,
      "COD payment is not in a reservable state",
      "PAYMENT_NOT_RESERVABLE",
    );
  }

  if (payment.provider !== "STRIPE" && payment.provider !== "COD") {
    throw new AppError(
      400,
      "Unsupported payment provider",
      "UNSUPPORTED_PAYMENT_PROVIDER",
    );
  }

  const items = aggregateItems(
    order.items
      .filter((item) => item.variantId !== null)
      .map((item) => ({
        variantId: item.variantId!,
        quantity: item.quantity,
      })),
  );

  if (items.length === 0 || items.length !== order.items.length) {
    throw new AppError(
      409,
      "Order contains items that cannot be reserved",
      "INVALID_ORDER_ITEMS",
    );
  }

  // Make retries safe. An existing reservation set must match the order.
  if (order.reservations.length > 0) {
    const existing = [...order.reservations]
      .map(({ variantId, quantity, status }) => ({
        variantId,
        quantity,
        status,
      }))
      .sort((a, b) => a.variantId.localeCompare(b.variantId));

    const matches =
      existing.length === items.length &&
      items.every(
        (item, index) =>
          existing[index].variantId === item.variantId &&
          existing[index].quantity === item.quantity,
      );

    const reusable = existing.every(
      (item) => item.status === "ACTIVE" || item.status === "CONFIRMED",
    );

    if (matches && reusable) {
      return { reservations: order.reservations, alreadyReserved: true };
    }

    throw new AppError(
      409,
      "This order already has a different or inactive reservation set",
      "RESERVATION_ALREADY_EXISTS",
    );
  }

  const expiresAt =
    payment.provider === "COD"
      ? COD_RESERVATION_EXPIRY
      : new Date(Date.now() + STRIPE_RESERVATION_MINUTES * 60_000);

  const reservations = [];

  for (const item of items) {
    const updated = await tx.$executeRaw`
      UPDATE "Inventory"
      SET "reserved" = "reserved" + ${item.quantity},
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "variantId" = ${item.variantId}
        AND "quantity" - "reserved" >= ${item.quantity}
    `;

    if (updated !== 1) {
      throw new AppError(
        409,
        `Insufficient available stock for variant ${item.variantId}`,
        "INSUFFICIENT_STOCK",
      );
    }

    const reservation = await tx.stockReservation.create({
      data: {
        orderId,
        variantId: item.variantId,
        quantity: item.quantity,
        expiresAt,
      },
    });

    await tx.inventoryMovement.create({
      data: {
        orderId,
        variantId: item.variantId,
        type: "RESERVATION",
        quantity: item.quantity,
        note: `Stock reserved for order ${order.orderNumber}`,
      },
    });

    reservations.push(reservation);
  }

  return { reservations, alreadyReserved: false };
}

/**
 * Existing standalone API retained for existing callers.
 */
export async function reserveOrderStock(orderId: string) {
  return prisma.$transaction((tx) =>
    reserveOrderStockInTransaction(tx, orderId),
  );
}


/**
 * Confirms active reservations and deducts the reserved quantities
 * from physical inventory. Used after successful Stripe payment
 * or when a COD order is accepted for fulfilment.
 */

export async function confirmOrderReservationsInTransaction(
  tx: Prisma.TransactionClient,
  orderId: string,
) {
  await tx.$queryRaw`
    SELECT "id"
    FROM "Order"
    WHERE "id" = ${orderId}
    FOR UPDATE
  `;

  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: {
      payments: true,
      reservations: true,
    },
  });

  if (!order) {
    throw new AppError(404, "Order not found", "ORDER_NOT_FOUND");
  }

  if (order.status === "CANCELLED" || order.status === "REFUNDED") {
    throw new AppError(
      409,
      "Cancelled or refunded orders cannot confirm reservations",
      "INVALID_ORDER_STATUS",
    );
  }

  const hasStripePayment = order.payments.some(
    (payment) => payment.provider === "STRIPE",
  );

  const hasCodPayment = order.payments.some(
    (payment) => payment.provider === "COD",
  );

  if (hasStripePayment && hasCodPayment) {
    throw new AppError(
      409,
      "Order has conflicting payment providers",
      "CONFLICTING_PAYMENT_PROVIDERS",
    );
  }

  const stripePaymentSucceeded = order.payments.some(
    (payment) =>
      payment.provider === "STRIPE" && payment.status === "SUCCEEDED",
  );

  if (hasStripePayment && !stripePaymentSucceeded) {
    throw new AppError(
      409,
      "Stripe payment must succeed before stock can be confirmed",
      "PAYMENT_NOT_SUCCEEDED",
    );
  }

  if (hasCodPayment && order.status !== "CONFIRMED") {
    throw new AppError(
      409,
      "COD orders must be accepted for fulfilment before stock confirmation",
      "COD_ORDER_NOT_CONFIRMED",
    );
  }

  if (!hasStripePayment && !hasCodPayment) {
    throw new AppError(
      409,
      "No supported payment record exists for this order",
      "PAYMENT_NOT_FOUND",
    );
  }

  const reservations = await tx.stockReservation.findMany({
    where: { orderId },
    orderBy: { variantId: "asc" },
  });

  if (reservations.length === 0) {
    throw new AppError(
      409,
      "No reservations exist for this order",
      "RESERVATIONS_NOT_FOUND",
    );
  }

  if (reservations.every((item) => item.status === "CONFIRMED")) {
    return { confirmed: 0, alreadyConfirmed: true };
  }

  const activeReservations = reservations.filter(
    (item) => item.status === "ACTIVE",
  );

  if (activeReservations.length !== reservations.length) {
    throw new AppError(
      409,
      "Some reservations are no longer active",
      "RESERVATIONS_NOT_ACTIVE",
    );
  }

  const now = new Date();
  let confirmed = 0;

  for (const reservation of activeReservations) {
    if (
      hasStripePayment &&
      reservation.expiresAt.getTime() <= now.getTime()
    ) {
      throw new AppError(
        409,
        "Stripe reservation has expired and cannot be confirmed",
        "RESERVATION_EXPIRED",
      );
    }

    const claimed = await tx.stockReservation.updateMany({
      where: {
        id: reservation.id,
        status: "ACTIVE",
        ...(hasStripePayment ? { expiresAt: { gt: now } } : {}),
      },
      data: { status: "CONFIRMED" },
    });

    if (claimed.count !== 1) {
      throw new AppError(
        409,
        "Reservation changed before it could be confirmed",
        "RESERVATION_STATE_CONFLICT",
      );
    }

    const updated = await tx.$executeRaw`
      UPDATE "Inventory"
      SET
        "quantity" = "quantity" - ${reservation.quantity},
        "reserved" = "reserved" - ${reservation.quantity},
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE
        "variantId" = ${reservation.variantId}
        AND "quantity" >= ${reservation.quantity}
        AND "reserved" >= ${reservation.quantity}
    `;

    if (updated !== 1) {
      throw new AppError(
        409,
        "Inventory could not confirm the reservation",
        "RESERVATION_INVENTORY_CONFLICT",
      );
    }

    await tx.inventoryMovement.create({
      data: {
        orderId,
        variantId: reservation.variantId,
        type: "SALE",
        quantity: -reservation.quantity,
        note: `Reserved stock consumed for order ${order.orderNumber}`,
      },
    });

    confirmed++;
  }

  return { confirmed, alreadyConfirmed: false };
}

export async function confirmOrderReservations(orderId: string) {
  return prisma.$transaction((tx) =>
    confirmOrderReservationsInTransaction(tx, orderId),
  );
}

/**
 * Releases active reservations without changing physical stock.
 * Used for cancellation and failed payments.
 */
export async function releaseOrderReservationsInTransaction(
  tx: Prisma.TransactionClient,
  orderId: string,
) {
  const reservations = await tx.stockReservation.findMany({
    where: { orderId, status: "ACTIVE" },
    orderBy: { variantId: "asc" },
  });

  let released = 0;

  for (const reservation of reservations) {
    const claimed = await tx.stockReservation.updateMany({
      where: { id: reservation.id, status: "ACTIVE" },
      data: { status: "RELEASED" },
    });

    if (claimed.count !== 1) continue;

    const updated = await tx.$executeRaw`
      UPDATE "Inventory"
      SET "reserved" = "reserved" - ${reservation.quantity},
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "variantId" = ${reservation.variantId}
        AND "reserved" >= ${reservation.quantity}
    `;

    if (updated !== 1) {
      throw new AppError(
        409,
        "Inventory could not release the reservation",
        "RESERVATION_INVENTORY_CONFLICT",
      );
    }

    await tx.inventoryMovement.create({
      data: {
        orderId,
        variantId: reservation.variantId,
        type: "RELEASE",
        quantity: -reservation.quantity,
        note: `Reserved stock released for order ${orderId}`,
      },
    });

    released++;
  }

  return { released };
}

export async function releaseOrderReservations(orderId: string) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`
      SELECT "id"
      FROM "Order"
      WHERE "id" = ${orderId}
      FOR UPDATE
    `;

    return releaseOrderReservationsInTransaction(tx, orderId);
  });
}

/**
 * Expires overdue unpaid Stripe reservations.
 * COD reservations are deliberately excluded.
 */
export async function expireStripeReservations(now = new Date()) {
  const candidates = await prisma.stockReservation.findMany({
    where: {
      status: "ACTIVE",
      expiresAt: { lte: now },
      order: {
        status: "PENDING",
        payments: {
          some: {
            provider: "STRIPE",
            status: { in: ["PENDING", "PROCESSING"] },
          },
        },
      },
    },
    select: { orderId: true },
    distinct: ["orderId"],
  });

  let expired = 0;

  for (const candidate of candidates) {
    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`
    SELECT "id"
    FROM "Order"
    WHERE "id" = ${candidate.orderId}
    FOR UPDATE
  `;
      const reservations = await tx.stockReservation.findMany({
        where: {
          orderId: candidate.orderId,
          status: "ACTIVE",
          expiresAt: { lte: now },
          order: {
            status: "PENDING",
            payments: {
              some: {
                provider: "STRIPE",
                status: { in: ["PENDING", "PROCESSING"] },
              },
            },
          },
        },
        orderBy: { variantId: "asc" },
      });

      let count = 0;

      for (const reservation of reservations) {
        const claimed = await tx.stockReservation.updateMany({
          where: {
            id: reservation.id,
            status: "ACTIVE",
            expiresAt: { lte: now },
          },
          data: { status: "EXPIRED" },
        });

        if (claimed.count !== 1) continue;

        const updated = await tx.$executeRaw`
          UPDATE "Inventory"
          SET "reserved" = "reserved" - ${reservation.quantity},
              "updatedAt" = CURRENT_TIMESTAMP
          WHERE "variantId" = ${reservation.variantId}
            AND "reserved" >= ${reservation.quantity}
        `;

        if (updated !== 1) {
          throw new AppError(
            409,
            "Inventory could not release an expired reservation",
            "RESERVATION_INVENTORY_CONFLICT",
          );
        }

        await tx.inventoryMovement.create({
          data: {
            orderId: candidate.orderId,
            variantId: reservation.variantId,
            type: "RELEASE",
            quantity: -reservation.quantity,
            note: `Expired reservation released for order ${candidate.orderId}`,
          },
        });

        count++;
      }

      return count;
    });

    expired += result;
  }

  return { expired };
}
