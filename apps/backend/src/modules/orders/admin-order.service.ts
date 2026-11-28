import type { Prisma } from "../../../generated/prisma/client.js";

import { prisma } from "../../config/database.js";
import { AppError } from "../../shared/errors/app-error.js";
import {
  confirmOrderReservationsInTransaction,
  releaseOrderReservationsInTransaction,
} from "../inventory/reservation.service.js";

type ListOrdersInput = {
  page: number;
  limit: number;
  status?:
    | "PENDING"
    | "CONFIRMED"
    | "PROCESSING"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED"
    | "REFUNDED";
  search?: string;
};

type UpdateOrderStatusInput = {
  status: "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  trackingNumber?: string;
};

async function withSerializableRetry<T>(
  operation: () => Promise<T>,
): Promise<T> {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      const isSerializationConflict =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2034";

      if (!isSerializationConflict || attempt === 3) {
        throw error;
      }
    }
  }

  throw new Error("Transaction retry limit exceeded");
}

export async function listOrders(input: ListOrdersInput) {
  const where: Prisma.OrderWhereInput = {
  ...(input.status ? { status: input.status } : {}),
  ...(input.search
    ? {
        orderNumber: {
          contains: input.search,
          mode: "insensitive",
        },
      }
    : {}),
};

  const skip = (input.page - 1) * input.limit;

  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: input.limit,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        subtotal: true,
        shippingFee: true,
        total: true,
        currency: true,
        createdAt: true,
        shippedAt: true,
        deliveredAt: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: { items: true },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders,
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      totalPages: Math.ceil(total / input.limit),
    },
  };
}

export async function getOrderById(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
      items: true,
      payments: {
        select: {
          id: true,
          provider: true,
          status: true,
          amount: true,
          currency: true,
          paidAt: true,
          createdAt: true,
        },
      },
      history: {
        orderBy: { createdAt: "asc" },
      },
      reservations: true,
    },
  });

  if (!order) {
    throw new AppError(404, "Order not found", "ORDER_NOT_FOUND");
  }

  return order;
}

export async function updateOrderStatus(
  orderId: string,
  input: UpdateOrderStatusInput,
) {
  return withSerializableRetry(() =>
    prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`
          SELECT "id"
          FROM "Order"
          WHERE "id" = ${orderId}
          FOR UPDATE
        `;

        const order = await tx.order.findUnique({
          where: { id: orderId },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            trackingNumber: true,
          },
        });

        if (!order) {
          throw new AppError(404, "Order not found", "ORDER_NOT_FOUND");
        }

        const allowedTransitions: Record<string, string[]> = {
          PENDING: ["CONFIRMED", "CANCELLED"],
          CONFIRMED: ["PROCESSING"],
          PROCESSING: ["SHIPPED"],
          SHIPPED: ["DELIVERED"],
        };

        if (!allowedTransitions[order.status]?.includes(input.status)) {
          throw new AppError(
            409,
            `Cannot change order status from ${order.status} to ${input.status}`,
            "INVALID_ORDER_STATUS_TRANSITION",
          );
        }

        const now = new Date();

        const data: Prisma.OrderUpdateManyMutationInput = {
          status: input.status,
          ...(input.status === "CANCELLED" ? { cancelledAt: now } : {}),
          ...(input.status === "SHIPPED"
            ? {
                shippedAt: now,
                trackingNumber: input.trackingNumber,
              }
            : {}),
          ...(input.status === "DELIVERED" ? { deliveredAt: now } : {}),
        };

        const updated = await tx.order.updateMany({
          where: {
            id: orderId,
            status: order.status,
          },
          data,
        });

        if (updated.count !== 1) {
          throw new AppError(
            409,
            "Order status changed before this update could be applied",
            "ORDER_STATUS_CONFLICT",
          );
        }

        if (input.status === "CONFIRMED") {
          await confirmOrderReservationsInTransaction(tx, orderId);
        }

        if (input.status === "CANCELLED") {
          await releaseOrderReservationsInTransaction(tx, orderId);
        }

        await tx.orderStatusHistory.create({
          data: {
            orderId,
            status: input.status,
            note:
              input.status === "SHIPPED"
                ? `Order shipped. Tracking number: ${input.trackingNumber}`
                : `Order status changed to ${input.status} by admin/staff`,
          },
        });

        return tx.order.findUniqueOrThrow({
          where: { id: orderId },
          include: {
            items: true,
            payments: {
              select: {
                id: true,
                provider: true,
                status: true,
                amount: true,
                currency: true,
                paidAt: true,
                createdAt: true,
              },
            },
            history: {
              orderBy: { createdAt: "asc" },
            },
          },
        });
      },
      { isolationLevel: "Serializable" },
    ),
  );
}