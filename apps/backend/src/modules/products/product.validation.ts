
import { z } from "zod";

const productStatusSchema = z.enum([
  "DRAFT",
  "ACTIVE",
  "ARCHIVED",
]);

const productFields = {
  categoryId: z.string().uuid(),
  artisanId: z.string().uuid().nullable().optional(),
  name: z.string().trim().min(1).max(120),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  description: z.string().trim().min(1).max(5000),
  material: z.string().trim().max(120).nullable().optional(),
  origin: z.string().trim().min(1).max(100).optional(),
  careInstructions: z.string().trim().max(2000).nullable().optional(),
  status: productStatusSchema.optional(),
  isFeatured: z.boolean().optional(),
};

export const createProductSchema = z.object({
  ...productFields,
}).strict();

export const updateProductSchema = z
  .object({
    categoryId: productFields.categoryId.optional(),
    artisanId: productFields.artisanId,
    name: productFields.name.optional(),
    slug: productFields.slug,
    description: productFields.description.optional(),
    material: productFields.material,
    origin: productFields.origin,
    careInstructions: productFields.careInstructions,
    status: productFields.status,
    isFeatured: productFields.isFeatured,
  })
  .strict()
  .refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    { message: "Provide at least one field to update" },
  );

export const productIdSchema = z.object({
  productId: z.string().uuid(),
});
