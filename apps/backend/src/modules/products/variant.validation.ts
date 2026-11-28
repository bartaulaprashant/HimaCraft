
import { z } from "zod";

export const createVariantSchema = z.object({
  sku: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(120),
  size: z.string().trim().max(50).nullable().optional(),
  color: z.string().trim().max(50).nullable().optional(),
  price: z.number().int().min(0),
  compareAtPrice: z.number().int().min(0).nullable().optional(),
  currency: z.string().regex(/^[A-Z]{3}$/).optional(),
}).strict();

export const updateVariantSchema = z
  .object({
    sku: z.string().trim().min(1).max(100).optional(),
    name: z.string().trim().min(1).max(120).optional(),
    size: z.string().trim().max(50).nullable().optional(),
    color: z.string().trim().max(50).nullable().optional(),
    price: z.number().int().min(0).optional(),
    compareAtPrice: z.number().int().min(0).nullable().optional(),
    currency: z.string().regex(/^[A-Z]{3}$/).optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    { message: "Provide at least one field to update" },
  );

export const productIdSchema = z.object({
  productId: z.string().uuid(),
});

export const variantParamsSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid(),
});
