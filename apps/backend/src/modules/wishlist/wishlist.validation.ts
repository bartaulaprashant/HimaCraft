import { z } from "zod";

export const addWishlistItemSchema = z
  .object({
    variantId: z.string().uuid(),
  })
  .strict();

export const wishlistVariantParamsSchema = z.object({
  variantId: z.string().uuid(),
});
