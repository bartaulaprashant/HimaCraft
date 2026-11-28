import { z } from "zod";

export const checkoutSchema = z
  .object({
    addressId: z.string().uuid(),
    customerNote: z.string().trim().max(500).optional(),
  })
  .strict();

export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const orderIdSchema = z.object({
  orderId: z.string().uuid(),
});