import { randomBytes } from "node:crypto";
import type { Prisma } from "../../../generated/prisma/client.js";

import { prisma } from "../../config/database.js";
import { AppError } from "../../shared/errors/app-error.js";
import {
  reserveOrderStockInTransaction,
  releaseOrderReservationsInTransaction,
} from "../inventory/reservation.service.js";
import { env } from "../../config/env.js";
import { getStripeClient } from "../../config/stripe.js";

type CheckoutInput = {
  addressId: string;
  customerNote?: string;
  paymentMethod: "COD" | "STRIPE";
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

async function lockCart(tx: Prisma.TransactionClient, userId: string) {
  const cart = await tx.cart.upsert({
    where: { userId },
    create: { userId },
    update: {},
    select: { id: true },
  });

  await tx.$queryRaw`
    SELECT "id"
    FROM "Cart"
    WHERE "id" = ${cart.id}
    FOR UPDATE
  `;

  return cart;
}

function generateOrderNumber() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = randomBytes(4).toString("hex").toUpperCase();

  return `HC-${date}-${suffix}`;
}

async function failStripeCheckout(orderId: string, paymentId: string) {
  await withSerializableRetry(() =>
    prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`
          SELECT "id"
          FROM "Order"
          WHERE "id" = ${orderId}
          FOR UPDATE
        `;

        const payment = await tx.payment.findFirst({
          where: {
            id: paymentId,
            orderId,
            provider: "STRIPE",
            status: "PENDING",
            providerPaymentId: null,
          },
          select: { id: true },
        });

        const order = await tx.order.findUnique({
          where: { id: orderId },
          select: { status: true },
        });

        // Do not overwrite a payment or order already handled elsewhere.
        if (!payment || order?.status !== "PENDING") {
          return;
        }

        await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: "FAILED",
            failureReason: "Stripe Checkout session creation failed",
          },
        });

        await tx.order.update({
          where: { id: orderId },
          data: {
            status: "CANCELLED",
            cancelledAt: new Date(),
          },
        });

        await releaseOrderReservationsInTransaction(tx, orderId);

        await tx.orderStatusHistory.create({
          data: {
            orderId,
            status: "CANCELLED",
            note: "Order cancelled because Stripe Checkout could not be created",
          },
        });
      },
      { isolationLevel: "Serializable" },
    ),
  );
}

export async function checkout(userId: string, input: CheckoutInput) {
  // Validate Stripe configuration before creating an order.
  const stripe = input.paymentMethod === "STRIPE" ? getStripeClient() : null;

  const order = await withSerializableRetry(() =>
    prisma.$transaction(
      async (tx) => {
        // Lock the cart before reading its contents. This serializes checkout
        // against concurrent cart mutations.
        const cart = await lockCart(tx, userId);

        const address = await tx.address.findFirst({
          where: {
            id: input.addressId,
            userId,
          },
        });

        if (!address) {
          throw new AppError(
            404,
            "Delivery address not found",
            "ADDRESS_NOT_FOUND",
          );
        }

        const cartItems = await tx.cartItem.findMany({
          where: { cartId: cart.id },
          orderBy: { createdAt: "asc" },
          include: {
            variant: {
              select: {
                id: true,
                name: true,
                sku: true,
                price: true,
                currency: true,
                isActive: true,
                product: {
                  select: {
                    name: true,
                    status: true,
                  },
                },
                inventory: {
                  select: {
                    quantity: true,
                    reserved: true,
                  },
                },
              },
            },
          },
        });

        if (cartItems.length === 0) {
          throw new AppError(400, "Your cart is empty", "EMPTY_CART");
        }

        let subtotal = 0;
        const currencies = new Set<string>();

        for (const item of cartItems) {
          const { variant, quantity } = item;

          if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
            throw new AppError(
              400,
              "Cart contains an invalid item quantity",
              "INVALID_CART_QUANTITY",
            );
          }

          if (!variant.isActive || variant.product.status !== "ACTIVE") {
            throw new AppError(
              409,
              `${variant.product.name} is no longer available`,
              "PRODUCT_UNAVAILABLE",
            );
          }

          if (!variant.inventory) {
            throw new AppError(
              409,
              `${variant.product.name} is out of stock`,
              "INSUFFICIENT_STOCK",
            );
          }

          const available =
            variant.inventory.quantity - variant.inventory.reserved;

          if (available < quantity) {
            throw new AppError(
              409,
              `Insufficient stock for ${variant.product.name} (${variant.name})`,
              "INSUFFICIENT_STOCK",
            );
          }

          if (!Number.isInteger(variant.price) || variant.price < 0) {
            throw new AppError(
              409,
              "A product has an invalid price",
              "INVALID_PRODUCT_PRICE",
            );
          }

          currencies.add(variant.currency);
          subtotal += variant.price * quantity;
        }

        if (currencies.size !== 1) {
          throw new AppError(
            409,
            "Cart items must use the same currency",
            "MIXED_CURRENCIES",
          );
        }

        if (!Number.isSafeInteger(subtotal)) {
          throw new AppError(
            400,
            "Order total exceeds the supported amount",
            "ORDER_AMOUNT_TOO_LARGE",
          );
        }

        const currency = cartItems[0].variant.currency;

        // Free shipping. Total is calculated exclusively from product prices.
        const shippingFee = 0;
        const total = subtotal;

        if (input.paymentMethod === "STRIPE") {
          const stripeAmount = total * 100;

          if (
            total <= 0 ||
            !Number.isSafeInteger(stripeAmount) ||
            stripeAmount > 99_999_999
          ) {
            throw new AppError(
              400,
              "Order amount is outside Stripe's supported range",
              "STRIPE_AMOUNT_UNSUPPORTED",
            );
          }
        }

        const order = await tx.order.create({
          data: {
            orderNumber: generateOrderNumber(),
            userId,
            status: "PENDING",
            subtotal,
            shippingFee,
            total,
            currency,

            // Snapshot delivery details so later address edits do not
            // change an existing order.
            shippingName: address.fullName,
            shippingPhone: address.phone,
            shippingAddress: [address.addressLine1, address.addressLine2]
              .filter(Boolean)
              .join(", "),
            shippingCity: address.city,
            shippingCountry: address.country,
            shippingPostalCode: address.postalCode,

            customerNote: input.customerNote || null,

            items: {
              create: cartItems.map((item) => ({
                variantId: item.variant.id,
                productName: item.variant.product.name,
                variantName: item.variant.name,
                sku: item.variant.sku,
                quantity: item.quantity,
                unitPrice: item.variant.price,
                total: item.variant.price * item.quantity,
                currency: item.variant.currency,
              })),
            },

            payments: {
              create: {
                provider: input.paymentMethod,
                status: "PENDING",
                amount: total,
                currency,
              },
            },

            history: {
              create: {
                status: "PENDING",
                note: "Order placed by customer",
              },
            },
          },
          select: { id: true },
        });

        // This uses the same transaction as order creation. If any item
        // cannot be reserved, the order and payment are rolled back too.
        await reserveOrderStockInTransaction(tx, order.id);

        // Only clear the cart after order creation and all reservations
        // have succeeded.
        await tx.cartItem.deleteMany({
          where: { cartId: cart.id },
        });

        const createdOrder = await tx.order.findUnique({
          where: { id: order.id },
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

        if (!createdOrder) {
          throw new AppError(
            500,
            "Could not retrieve the created order",
            "ORDER_RETRIEVAL_FAILED",
          );
        }

        return createdOrder;
      },
      {
        isolationLevel: "Serializable",
      },
    ),
  );

  if (!stripe) {
    return {
      order,
      checkoutUrl: null,
    };
  }

  const payment = order.payments[0];

  if (!payment) {
    throw new AppError(
      500,
      "Order payment record could not be retrieved",
      "PAYMENT_NOT_FOUND",
    );
  }

  const customer = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!customer) {
    await failStripeCheckout(order.id, payment.id);

    throw new AppError(404, "Customer account not found", "CUSTOMER_NOT_FOUND");
  }

  let session;

  try {
    session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        allowed_payment_method_types: ["card"],
        customer_email: customer.email,

        line_items: order.items.map((item) => ({
          quantity: item.quantity,
          price_data: {
            currency: item.currency.toLowerCase(),
            unit_amount: item.unitPrice * 100,
            product_data: {
              name: `${item.productName} - ${item.variantName}`,
            },
          },
        })),

        success_url: `${env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${env.FRONTEND_URL}/checkout/cancel?orderId=${order.id}`,

        metadata: {
          orderId: order.id,
          paymentId: payment.id,
        },

        payment_intent_data: {
          metadata: {
            orderId: order.id,
            paymentId: payment.id,
          },
        },
      },
      {
        idempotencyKey: `checkout-${payment.id}`,
      },
    );
  } catch {
    await failStripeCheckout(order.id, payment.id);

    throw new AppError(
      502,
      "Could not initialize Stripe Checkout. Please try again.",
      "STRIPE_SESSION_CREATION_FAILED",
    );
  }

  if (!session.url) {
    try {
      await stripe.checkout.sessions.expire(session.id);
      await failStripeCheckout(order.id, payment.id);
    } catch {
      // Leave the order pending if Stripe expiration fails.
      // The reservation expiry worker will eventually release stock.
    }

    throw new AppError(
      502,
      "Stripe did not return a Checkout URL",
      "STRIPE_CHECKOUT_URL_MISSING",
    );
  }

  try {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerPaymentId: session.id,
      },
    });
  } catch {
    // The session exists, but its ID could not be persisted.
    // Attempt to expire it before releasing the reservation.
    try {
      await stripe.checkout.sessions.expire(session.id);
      await failStripeCheckout(order.id, payment.id);
    } catch {
      // Leave pending for webhook reconciliation or reservation expiry.
    }

    throw new AppError(
      502,
      "Could not finalize Stripe Checkout. Please try again.",
      "STRIPE_SESSION_PERSISTENCE_FAILED",
    );
  }

  return {
    order,
    checkoutUrl: session.url,
  };
}

export async function listCustomerOrders(
  userId: string,
  input: { page: number; limit: number },
) {
  const skip = (input.page - 1) * input.limit;

  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where: { userId },
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
        cancelledAt: true,
        _count: {
          select: { items: true },
        },
      },
    }),
    prisma.order.count({
      where: { userId },
    }),
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

export async function getCustomerOrder(userId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
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

  if (!order) {
    throw new AppError(404, "Order not found", "ORDER_NOT_FOUND");
  }

  return order;
}

export async function cancelCustomerOrder(userId: string, orderId: string) {
  return withSerializableRetry(() =>
    prisma.$transaction(
      async (tx) => {
        // Serialize cancellation against other order lifecycle operations.
        await tx.$queryRaw`
          SELECT "id"
          FROM "Order"
          WHERE "id" = ${orderId}
            AND "userId" = ${userId}
          FOR UPDATE
        `;

        const order = await tx.order.findFirst({
          where: {
            id: orderId,
            userId,
          },
          select: {
            id: true,
            orderNumber: true,
            status: true,
          },
        });

        if (!order) {
          throw new AppError(404, "Order not found", "ORDER_NOT_FOUND");
        }

        if (order.status !== "PENDING") {
          throw new AppError(
            409,
            "Only pending orders can be cancelled",
            "ORDER_NOT_CANCELLABLE",
          );
        }

        const updated = await tx.order.updateMany({
          where: {
            id: orderId,
            userId,
            status: "PENDING",
          },
          data: {
            status: "CANCELLED",
            cancelledAt: new Date(),
          },
        });

        if (updated.count !== 1) {
          throw new AppError(
            409,
            "Order could not be cancelled",
            "ORDER_CANCELLATION_CONFLICT",
          );
        }

        // Release active reservations in this same transaction.
        await releaseOrderReservationsInTransaction(tx, orderId);

        await tx.orderStatusHistory.create({
          data: {
            orderId,
            status: "CANCELLED",
            note: "Order cancelled by customer",
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
      {
        isolationLevel: "Serializable",
      },
    ),
  );
}
