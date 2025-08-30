import { z } from "zod"

export const checkAvailabilitySchema = z.object({
  hallId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
})

export const bookingSchema = z.object({
  venueId: z.string().min(1),
  hallId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  guestCount: z.number().int().min(1),
  customerDetails: z.object({
    name: z.string().min(2),
    phone: z.string().min(7),
    email: z.string().email(),
  }),
})
