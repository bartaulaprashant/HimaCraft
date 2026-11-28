
import { prisma } from "../../config/database.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { z } from "zod";
import type { productListQuerySchema } from "./catalog.validation.js";

type ProductListQuery = z.infer<typeof productListQuerySchema>;

const productCardInclude = {
  category: {
    select: { id: true, name: true, slug: true },
  },
  artisan: {
    select: { id: true, name: true, slug: true },
  },
  images: {
    where: { isPrimary: true },
    take: 1,
    select: {
      id: true,
      url: true,
      altText: true,
    },
  },
  variants: {
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      sku: true,
      price: true,
      compareAtPrice: true,
      currency: true,
      size: true,
      color: true,
      inventory: {
        select: {
          quantity: true,
          reserved: true,
        },
      },
    },
  },
} as const;

export async function listPublicProducts(query: ProductListQuery) {
  const {
    page,
    limit,
    search,
    categoryId,
    artisanId,
    material,
    minPrice,
    maxPrice,
    sortBy,
  } = query;

  const priceFilter =
    minPrice !== undefined || maxPrice !== undefined
      ? {
          some: {
            isActive: true,
            ...(minPrice !== undefined ? { price: { gte: minPrice } } : {}),
            ...(maxPrice !== undefined ? { price: { lte: maxPrice } } : {}),
          },
        }
      : undefined;

  const where = {
    status: "ACTIVE" as const,
    ...(search
      ? { name: { contains: search, mode: "insensitive" as const } }
      : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(artisanId ? { artisanId } : {}),
    ...(material
      ? { material: { contains: material, mode: "insensitive" as const } }
      : {}),
    ...(priceFilter ? { variants: priceFilter } : {}),
  };

  const skip = (page - 1) * limit;

  const orderBy =
    sortBy === "name_asc"
      ? { name: "asc" as const }
      : sortBy === "name_desc"
        ? { name: "desc" as const }
        : { createdAt: "desc" as const };

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: productCardInclude,
      orderBy,
      ...(sortBy.startsWith("price_") ? {} : { skip, take: limit }),
    }),
  ]);

  let results = products;

  // Price sorting uses the lowest active variant price.
  if (sortBy.startsWith("price_")) {
    results = [...products].sort((a, b) => {
      const aPrice = Math.min(...a.variants.map((v) => v.price));
      const bPrice = Math.min(...b.variants.map((v) => v.price));

      return sortBy === "price_asc"
        ? aPrice - bPrice
        : bPrice - aPrice;
    });

    results = results.slice(skip, skip + limit);
  }

  return {
    products: results,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
  };
}

export async function getPublicProductBySlug(slug: string) {
  const product = await prisma.product.findFirst({
    where: {
      slug,
      status: "ACTIVE",
    },
    include: {
      category: {
        select: { id: true, name: true, slug: true },
      },
      artisan: {
        select: {
          id: true,
          name: true,
          slug: true,
          bio: true,
          location: true,
          imageUrl: true,
          isVerified: true,
        },
      },
      images: {
        orderBy: [
          { isPrimary: "desc" },
          { sortOrder: "asc" },
        ],
      },
      variants: {
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
        include: {
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

  if (!product) {
    throw new AppError(
      404,
      "Product not found",
      "PRODUCT_NOT_FOUND",
    );
  }

  return product;
}
