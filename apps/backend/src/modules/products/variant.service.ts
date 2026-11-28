
import { prisma } from "../../config/database.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { z } from "zod";
import type {
  createVariantSchema,
  updateVariantSchema,
} from "./variant.validation.js";

type CreateVariantInput = z.infer<typeof createVariantSchema>;
type UpdateVariantInput = z.infer<typeof updateVariantSchema>;

const variantInclude = {
  inventory: true,
} as const;

function isPrismaError(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}

async function ensureProductExists(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });

  if (!product) {
    throw new AppError(404, "Product not found", "PRODUCT_NOT_FOUND");
  }
}

async function ensureVariantExists(productId: string, variantId: string) {
  const variant = await prisma.productVariant.findFirst({
    where: { id: variantId, productId },
    select: { id: true },
  });

  if (!variant) {
    throw new AppError(404, "Product variant not found", "VARIANT_NOT_FOUND");
  }
}

export async function listVariants(productId: string) {
  await ensureProductExists(productId);

  return prisma.productVariant.findMany({
    where: { productId },
    orderBy: { createdAt: "asc" },
    include: variantInclude,
  });
}

export async function getVariantById(
  productId: string,
  variantId: string,
) {
  const variant = await prisma.productVariant.findFirst({
    where: { id: variantId, productId },
    include: variantInclude,
  });

  if (!variant) {
    throw new AppError(404, "Product variant not found", "VARIANT_NOT_FOUND");
  }

  return variant;
}

export async function createVariant(
  productId: string,
  input: CreateVariantInput,
) {
  await ensureProductExists(productId);

  try {
    return await prisma.productVariant.create({
      data: {
        ...input,
        productId,
        inventory: {
          create: {
            quantity: 0,
            reserved: 0,
          },
        },
      },
      include: variantInclude,
    });
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      throw new AppError(409, "SKU already exists", "SKU_ALREADY_EXISTS");
    }

    throw error;
  }
}

export async function updateVariant(
  productId: string,
  variantId: string,
  input: UpdateVariantInput,
) {
  await ensureVariantExists(productId, variantId);

  try {
    return await prisma.productVariant.update({
      where: { id: variantId },
      data: input,
      include: variantInclude,
    });
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      throw new AppError(409, "SKU already exists", "SKU_ALREADY_EXISTS");
    }

    if (isPrismaError(error, "P2025")) {
      throw new AppError(404, "Product variant not found", "VARIANT_NOT_FOUND");
    }

    throw error;
  }
}

export async function deactivateVariant(
  productId: string,
  variantId: string,
) {
  await ensureVariantExists(productId, variantId);

  try {
    return await prisma.productVariant.update({
      where: { id: variantId },
      data: { isActive: false },
      select: {
        id: true,
        productId: true,
        sku: true,
        isActive: true,
      },
    });
  } catch (error) {
    if (isPrismaError(error, "P2025")) {
      throw new AppError(404, "Product variant not found", "VARIANT_NOT_FOUND");
    }

    throw error;
  }
}
