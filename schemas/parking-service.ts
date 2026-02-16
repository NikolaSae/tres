// schemas/parking-service.ts - SAMO VALIDACIJA
import { z } from "zod";

export const parkingServiceSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  contactName: z.string().max(100).optional(),
  email: z.string().email().max(100).optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
  additionalEmails: z.array(z.string().email()).default([]),
  isActive: z.boolean().default(true),
});

export const parkingServiceUpdateSchema = parkingServiceSchema.extend({
  id: z.string().min(1),
});

export type ParkingServiceInput = z.infer<typeof parkingServiceSchema>;
export type ParkingServiceUpdateInput = z.infer<typeof parkingServiceUpdateSchema>;