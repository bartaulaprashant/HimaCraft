import { z } from "zod";

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const createArtisanSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: slugSchema.optional(),
  bio: z.string().trim().max(3000).nullable().optional(),
  location: z.string().trim().max(120).nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  isVerified: z.boolean().optional(),
  isActive: z.boolean().optional(),
}).strict();

export const updateArtisanSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    slug: slugSchema.optional(),
    bio: z.string().trim().max(3000).nullable().optional(),
    location: z.string().trim().max(120).nullable().optional(),
    imageUrl: z.string().url().nullable().optional(),
    isVerified: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    { message: "Provide at least one field to update" },
  );

export const artisanIdSchema = z.object({
  artisanId: z.string().uuid(),
});