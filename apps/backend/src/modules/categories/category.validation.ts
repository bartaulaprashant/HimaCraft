
import { z } from "zod";

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: slugSchema.optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  parentId: z.string().uuid().nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
}).strict();

export const updateCategorySchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    slug: slugSchema.optional(),
    description: z.string().trim().max(1000).nullable().optional(),
    imageUrl: z.string().url().nullable().optional(),
    parentId: z.string().uuid().nullable().optional(),
    sortOrder: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    { message: "Provide at least one field to update" },
  );

export const categoryIdSchema = z.object({
  categoryId: z.string().uuid(),
});
