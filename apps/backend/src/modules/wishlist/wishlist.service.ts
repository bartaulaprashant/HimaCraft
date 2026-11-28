import { prisma } from "../../config/database.js";
import { AppError } from "../../shared/errors/app-error.js";

const wishlistInclude = {
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
} as const;

async function validateVariant(variantId: string) {
  const variant = await prisma.productVariant.findFirst({
    where: {
      id: variantId,
      isActive: true,
      product: {
        is: { status: "ACTIVE" },
      },
    },
    select: { id: true },
  });

  if (!variant) {
    throw new AppError(
      404,
      "Active product variant not found",
      "VARIANT_NOT_FOUND",
    );
  }
}

export async function getWishlist(userId: string) {
  const items = await prisma.wishlistItem.findMany({
    where: { userId },
    include: wishlistInclude,
    orderBy: { createdAt: "desc" },
  });

  return {
    items: items.map((item) => ({
      ...item,
      availableStock: item.variant.inventory
        ? Math.max(
            0,
            item.variant.inventory.quantity - item.variant.inventory.reserved,
          )
        : 0,
    })),
    itemCount: items.length,
  };
}

export async function addWishlistItem(
  userId: string,
  variantId: string,
) {
  await validateVariant(variantId);

  await prisma.wishlistItem.upsert({
    where: {
      userId_variantId: {
        userId,
        variantId,
      },
    },
    create: {
      userId,
      variantId,
    },
    update: {},
  });

  return getWishlist(userId);
}

export async function removeWishlistItem(
  userId: string,
  variantId: string,
) {
  const result = await prisma.wishlistItem.deleteMany({
    where: {
      userId,
      variantId,
    },
  });

  if (result.count === 0) {
    throw new AppError(
      404,
      "Wishlist item not found",
      "WISHLIST_ITEM_NOT_FOUND",
    );
  }

  return getWishlist(userId);
}
