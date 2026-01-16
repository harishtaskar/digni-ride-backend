import { z } from 'zod';

export const createRequestSchema = z.object({
  note: z.string().optional(),
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;
