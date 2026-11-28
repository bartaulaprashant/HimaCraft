
import { prisma } from "../../config/database.js";
import { AppError } from "../../shared/errors/app-error.js";

import type { z } from "zod";

import type {
  createProductSchema,
  updateProductSchema,
} from "./product.validation.js";

type CreateProductInput = z.infer<typeof createProductSchema>;
type UpdateProductInput = z.infer<typeof updateProductSchema>;

const productInclude = {
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  artisan: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
} as const;

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .trim()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function isPrismaError(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}

async function validateReferences(
  categoryId?: string,
  artisanId?: string | null,
) {
  if (categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });

    if (!category) {
      throw new AppError(
        404,
        "Category not found",
        "CATEGORY_NOT_FOUND",
      );
    }
  }

  if (artisanId) {
    const artisan = await prisma.artisan.findUnique({
      where: { id: artisanId },
      select: { id: true },
    });

    if (!artisan) {
      throw new AppError(
        404,
        "Artisan not found",
        "ARTISAN_NOT_FOUND",
      );
    }
  }
}

export async function createProduct(input: CreateProductInput) {
  const slug = input.slug ?? slugify(input.name);

  if (!slug) {
    throw new AppError(
      400,
      "Provide a valid product slug",
      "INVALID_PRODUCT_SLUG",
    );
  }

  await validateReferences(input.categoryId, input.artisanId);

  try {
    return await prisma.product.create({
      data: {
        ...input,
        slug,
      },
      include: productInclude,
    });
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      throw new AppError(
        409,
        "Product slug already exists",
        "PRODUCT_SLUG_EXISTS",
      );
    }

    throw error;
  }
}

export async function getProductById(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: productInclude,
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

export async function updateProduct(
  productId: string,
  input: UpdateProductInput,
) {
  const existing = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError(
      404,
      "Product not found",
      "PRODUCT_NOT_FOUND",
    );
  }

  await validateReferences(input.categoryId, input.artisanId);

  try {
    return await prisma.product.update({
      where: { id: productId },
      data: input,
      include: productInclude,
    });
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      throw new AppError(
        409,
        "Product slug already exists",
        "PRODUCT_SLUG_EXISTS",
      );
    }

    if (isPrismaError(error, "P2025")) {
      throw new AppError(
        404,
        "Product not found",
        "PRODUCT_NOT_FOUND",
      );
    }

    throw error;
  }
}

export async function archiveProduct(productId: string) {
  try {
    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        status: "ARCHIVED",
        isFeatured: false,
      },
      select: {
        id: true,
        status: true,
      },
    });

    return product;
  } catch (error) {
    if (isPrismaError(error, "P2025")) {
      throw new AppError(
        404,
        "Product not found",
        "PRODUCT_NOT_FOUND",
      );
    }

    throw error;
  }
}
