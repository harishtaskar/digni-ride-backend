import { z } from "zod";

export const createAddressSchema = z.object({
  title: z.string().min(1, "Title is required").max(50, "Title too long"),
  address: z.record(z.any()).refine((val) => Object.keys(val).length > 0, {
    message: "Address details cannot be empty",
  }),
});

export const updateAddressSchema = z.object({
  title: z.string().min(1, "Title is required").max(50, "Title too long").optional(),
  address: z
    .record(z.any())
    .refine((val) => Object.keys(val).length > 0, {
      message: "Address details cannot be empty",
    })
    .optional(),
});

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
