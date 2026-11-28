import type { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../config/database.js";
import { AppError } from "../../shared/errors/app-error.js";

const cartInclude = {
  items: {
    orderBy: { createdAt: "asc" as const },
    include: {
      variant: {
        select: {
          id: true,
          name: true,
          sku: true,
          price: true,
          compareAtPrice: true,
          currency: true,
          size: true,
          color: true,
          isActive: true,
          inventory: {
            select: {
              quantity: true,
              reserved: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              status: true,
              images: {
                where: { isPrimary: true },
                take: 1,
                select: {
                  url: true,
                  altText: true,
                },
              },
            },
          },
        },
      },
    },
  },
} as const;

async function getOrCreateCart(userId: string) {
  return prisma.cart.upsert({
    where: { userId },
    create: { userId },
    update: {},
    select: { id: true },
  });
}

async function lockCart(tx: Prisma.TransactionClient, userId: string) {
  const cart = await tx.cart.upsert({
    where: { userId },
    create: { userId },
    update: {},
    select: { id: true },
  });

  // Serialize changes to this customer's cart.
  await tx.$queryRaw`
    SELECT "id" FROM "Cart" WHERE "id" = ${cart.id} FOR UPDATE
  `;

  return cart;
}

async function getActiveVariant(
  tx: Prisma.TransactionClient,
  variantId: string,
) {
  const variant = await tx.productVariant.findFirst({
    where: {
      id: variantId,
      isActive: true,
      product: {
        is: { status: "ACTIVE" },
      },
    },
    select: {
      id: true,
      inventory: {
        select: {
          quantity: true,
          reserved: true,
        },
      },
    },
  });

  if (!variant) {
    throw new AppError(
      404,
      "Active product variant not found",
      "VARIANT_NOT_FOUND",
    );
  }

  return variant;
}

function getAvailableStock(inventory: {
  quantity: number;
  reserved: number;
} | null) {
  return inventory
    ? Math.max(0, inventory.quantity - inventory.reserved)
    : 0;
}

export async function getCart(userId: string) {
  const cart = await getOrCreateCart(userId);

  const result = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: cartInclude,
  });

  if (!result) {
    throw new AppError(404, "Cart not found", "CART_NOT_FOUND");
  }

  const items = result.items.map((item) => {
    const availableStock = getAvailableStock(item.variant.inventory);

    const isAvailable =
      item.variant.isActive &&
      item.variant.product.status === "ACTIVE" &&
      availableStock >= item.quantity;

    return {
      ...item,
      availableStock,
      isAvailable,
      lineTotal: item.variant.price * item.quantity,
    };
  });

  return {
    id: result.id,
    userId: result.userId,
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.lineTotal, 0),
    updatedAt: result.updatedAt,
  };
}

export async function addCartItem(
  userId: string,
  variantId: string,
  quantity: number,
) {
  await prisma.$transaction(async (tx) => {
    const cart = await lockCart(tx, userId);
    const variant = await getActiveVariant(tx, variantId);

    const existing = await tx.cartItem.findUnique({
      where: {
        cartId_variantId: {
          cartId: cart.id,
          variantId,
        },
      },
    });

    const newQuantity = (existing?.quantity ?? 0) + quantity;

    if (newQuantity > 99) {
      throw new AppError(
        400,
        "Maximum quantity per variant is 99",
        "MAX_CART_QUANTITY_EXCEEDED",
      );
    }

    const availableStock = getAvailableStock(variant.inventory);

    if (newQuantity > availableStock) {
      throw new AppError(
        409,
        "Requested quantity exceeds available stock",
        "INSUFFICIENT_STOCK",
      );
    }

    await tx.cartItem.upsert({
      where: {
        cartId_variantId: {
          cartId: cart.id,
          variantId,
        },
      },
      create: {
        cartId: cart.id,
        variantId,
        quantity,
      },
      update: {
        quantity: newQuantity,
      },
    });
  });

  return getCart(userId);
}

export async function updateCartItem(
  userId: string,
  itemId: string,
  quantity: number,
) {
  await prisma.$transaction(async (tx) => {
    const cart = await lockCart(tx, userId);

    const item = await tx.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
      select: {
        id: true,
        variantId: true,
      },
    });

    if (!item) {
      throw new AppError(404, "Cart item not found", "CART_ITEM_NOT_FOUND");
    }

    const variant = await getActiveVariant(tx, item.variantId);
    const availableStock = getAvailableStock(variant.inventory);

    if (quantity > availableStock) {
      throw new AppError(
        409,
        "Requested quantity exceeds available stock",
        "INSUFFICIENT_STOCK",
      );
    }

    await tx.cartItem.update({
      where: { id: item.id },
      data: { quantity },
    });
  });

  return getCart(userId);
}

export async function removeCartItem(userId: string, itemId: string) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!cart) {
    throw new AppError(404, "Cart item not found", "CART_ITEM_NOT_FOUND");
  }

  const result = await prisma.cartItem.deleteMany({
    where: {
      id: itemId,
      cartId: cart.id,
    },
  });

  if (result.count === 0) {
    throw new AppError(404, "Cart item not found", "CART_ITEM_NOT_FOUND");
  }

  return getCart(userId);
}

export async function clearCart(userId: string) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!cart) {
    return { deleted: 0 };
  }

  const result = await prisma.cartItem.deleteMany({
    where: { cartId: cart.id },
  });

  return { deleted: result.count };
}
