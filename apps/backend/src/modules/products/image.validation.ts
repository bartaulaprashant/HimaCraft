
import { z } from "zod";

export const uploadImageSchema = z.object({
  altText: z.string().trim().max(255).optional(),
  sortOrder: z.coerce.number().int().min(0).max(10000).optional(),
  isPrimary: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
}).strict();

export const updateImageSchema = z.object({
  altText: z.string().trim().max(255).nullable().optional(),
  sortOrder: z.number().int().min(0).max(10000).optional(),
}).strict().refine(
  (data) => Object.values(data).some((value) => value !== undefined),
  { message: "Provide at least one field to update" },
);

export const imageParamsSchema = z.object({
  productId: z.string().uuid(),
  imageId: z.string().uuid(),
});
