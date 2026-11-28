import { prisma } from "../../config/database.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { z } from "zod";
import type {
  inventoryAdjustmentBodySchema,
  inventoryListQuerySchema,
} from "./inventory.validation.js";

type InventoryListQuery = z.infer<typeof inventoryListQuerySchema>;
type InventoryAdjustmentInput = z.infer<
  typeof inventoryAdjustmentBodySchema
>;

const inventoryInclude = {
  variant: {
    select: {
      id: true,
      sku: true,
      name: true,
      size: true,
      color: true,
      price: true,
      currency: true,
      isActive: true,
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  },
} as const;

function serializeInventory<T extends {
  quantity: number;
  reserved: number;
}>(inventory: T) {
  return {
    ...inventory,
    availableStock: inventory.quantity - inventory.reserved,
  };
}

export async function listInventory(query: InventoryListQuery) {
  const { page, limit } = query;
  const skip = (page - 1) * limit;

  const [total, inventoryRecords] = await Promise.all([
    prisma.inventory.count(),

    prisma.inventory.findMany({
      skip,
      take: limit,
      orderBy: { updatedAt: "desc" },
      include: inventoryInclude,
    }),
  ]);

  return {
    inventory: inventoryRecords.map(serializeInventory),
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

export async function getInventoryByVariantId(variantId: string) {
  const inventory = await prisma.inventory.findUnique({
    where: { variantId },
    include: inventoryInclude,
  });

  if (!inventory) {
    throw new AppError(
      404,
      "Inventory not found for this variant",
      "INVENTORY_NOT_FOUND",
    );
  }

  return serializeInventory(inventory);
}

export async function adjustInventory(
  variantId: string,
  input: InventoryAdjustmentInput,
) {
  return prisma.$transaction(async (tx) => {
    // Atomic conditional update prevents concurrent requests from
    // reducing physical stock below reserved stock.
    const updatedRows = await tx.$queryRaw<Array<{ id: string }>>`
      UPDATE "Inventory"
      SET
        "quantity" = (
          "quantity"::bigint + ${input.quantity}::bigint
        )::integer,
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE
        "variantId" = ${variantId}
        AND (
          "quantity"::bigint + ${input.quantity}::bigint
        ) >= "reserved"::bigint
        AND (
          "quantity"::bigint + ${input.quantity}::bigint
        ) >= 0
        AND (
          "quantity"::bigint + ${input.quantity}::bigint
        ) <= 2147483647
      RETURNING "id"
    `;

    if (updatedRows.length === 0) {
      const existingInventory = await tx.inventory.findUnique({
        where: { variantId },
        select: { id: true },
      });

      if (!existingInventory) {
        throw new AppError(
          404,
          "Inventory not found for this variant",
          "INVENTORY_NOT_FOUND",
        );
      }

      throw new AppError(
        409,
        "Adjustment would make stock lower than reserved stock or exceed the supported quantity",
        "INVENTORY_CONSTRAINT_VIOLATION",
      );
    }

    const movement = await tx.inventoryMovement.create({
      data: {
        variantId,
        type: input.type,
        quantity: input.quantity,
        note: input.note,
      },
    });

    const inventory = await tx.inventory.findUniqueOrThrow({
      where: { variantId },
      include: inventoryInclude,
    });

    return {
      inventory: serializeInventory(inventory),
      movement,
    };
  });
}