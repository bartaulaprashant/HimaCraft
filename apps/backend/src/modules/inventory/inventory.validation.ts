import { z } from "zod";

export const inventoryListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
  })
  .strict();

export const inventoryVariantParamsSchema = z.object({
  variantId: z.string().uuid(),
});

export const inventoryAdjustmentBodySchema = z
  .object({
    type: z.enum(["RESTOCK", "RETURN", "ADJUSTMENT"]),
    quantity: z
      .number()
      .int()
      .min(-2_147_483_647)
      .max(2_147_483_647)
      .refine((value) => value !== 0, "Quantity cannot be zero"),
    note: z.string().trim().min(1).max(500).optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (
      (value.type === "RESTOCK" || value.type === "RETURN") &&
      value.quantity < 1
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["quantity"],
        message: `${value.type} quantity must be positive`,
      });
    }
  });