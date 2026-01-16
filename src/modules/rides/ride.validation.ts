import { z } from 'zod';

export const createRideSchema = z.object({
  startLocation: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string(),
  }),
  endLocation: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string(),
  }),
  departureTime: z.string().datetime(),
  note: z.string().optional(),
});

export const getRidesQuerySchema = z.object({
  city: z.string().optional(),
  status: z.enum(['OPEN', 'MATCHED', 'COMPLETED']).optional(),
  departureFrom: z.string().datetime().optional(),
  departureTo: z.string().datetime().optional(),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional(),
  offset: z.string().transform(Number).pipe(z.number().min(0)).optional(),
});

export type CreateRideInput = z.infer<typeof createRideSchema>;
export type GetRidesQuery = z.infer<typeof getRidesQuerySchema>;
