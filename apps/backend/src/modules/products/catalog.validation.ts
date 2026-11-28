
import { z } from "zod";

export const productListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),

    search: z.string().trim().max(120).optional(),
    categoryId: z.string().uuid().optional(),
    artisanId: z.string().uuid().optional(),
    material: z.string().trim().max(120).optional(),

    minPrice: z.coerce.number().int().min(0).optional(),
    maxPrice: z.coerce.number().int().min(0).optional(),

    sortBy: z
      .enum([
        "newest",
        "price_asc",
        "price_desc",
        "name_asc",
        "name_desc",
      ])
      .default("newest"),
  })
  .strict()
  .refine(
    (data) =>
      data.minPrice === undefined ||
      data.maxPrice === undefined ||
      data.minPrice <= data.maxPrice,
    {
      message: "minPrice cannot be greater than maxPrice",
      path: ["minPrice"],
    },
  );

export const productSlugSchema = z.object({
  slug: z.string().trim().min(1).max(120),
});
