
import { z } from "zod";

const passwordSchema = z
  .string()
  .min(10, "Password must contain at least 10 characters")
  .max(128, "Password cannot exceed 128 characters");

export const registerSchema = z.object({
  email: z.string().trim().email().max(254),
  password: passwordSchema,
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  phone: z.string().trim().max(25).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: passwordSchema,
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email().max(254),
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().email().max(254),
  otp: z.string().regex(/^\d{6}$/, "OTP must contain exactly 6 digits"),
  newPassword: passwordSchema,
});
