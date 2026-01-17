import { z } from 'zod';

export const loginSchema = z.object({
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 characters")
    .max(15),
});

export const registerSchema = z.object({
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 characters")
    .max(15),
  name: z.string().min(2, "Name is required"),
  city: z.string().min(2, "City is required"),
});

export const verifyOtpSchema = z.object({
  phone: z.string().min(10).max(15),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
