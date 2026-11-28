import { z } from "zod";

const orderStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
]);

export const adminOrderListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: orderStatusSchema.optional(),
  search: z.string().trim().min(1).max(120).optional(),
});

export const adminOrderIdSchema = z.object({
  orderId: z.string().uuid(),
});

export const updateAdminOrderStatusSchema = z
  .object({
    status: z.enum([
      "CONFIRMED",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
    ]),
    trackingNumber: z.string().trim().min(1).max(100).optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.status !== "SHIPPED" || Boolean(data.trackingNumber),
    {
      message: "A tracking number is required when shipping an order",
      path: ["trackingNumber"],
    },
  );