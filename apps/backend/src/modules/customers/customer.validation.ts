import { z } from "zod";

export const updateProfileSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80).optional(),
    lastName: z.string().trim().min(1).max(80).optional(),
    phone: z
      .union([
        z.string().trim().min(1).max(25),
        z.literal(""),
        z.null(),
      ])
      .optional(),
  })
  .strict()
  .refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    { message: "Provide at least one profile field to update" },
  );

const addressFields = {
  fullName: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(1).max(25),
  addressLine1: z.string().trim().min(1).max(200),
  addressLine2: z.string().trim().max(200).nullable().optional(),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().max(100).nullable().optional(),
  postalCode: z.string().trim().max(20).nullable().optional(),
  country: z.string().trim().min(1).max(100),
};

export const createAddressSchema = z.object({
  ...addressFields,
  isDefault: z.boolean().optional(),
}).strict();

export const updateAddressSchema = z
  .object({
    ...Object.fromEntries(
      Object.entries(addressFields).map(([key, schema]) => [
        key,
        schema.optional(),
      ]),
    ),
    isDefault: z.boolean().optional(),
  })
  .strict()
  .refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    { message: "Provide at least one address field to update" },
  );

export const addressIdSchema = z.object({
  addressId: z.string().uuid(),
});
