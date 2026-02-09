// /schemas/service.ts

import { z } from "zod";
import { ServiceType } from "@prisma/client";

export const serviceSchema = z.object({
  name: z.string().min(3, "Naziv servisa mora imati najmanje 3 karaktera"),
  type: z.nativeEnum(ServiceType),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

// OVO JE KLJUČNO – dodaj ovaj export tipa
export type ServiceFormData = z.infer<typeof serviceSchema>;

// Schema za ažuriranje (partial + id)
export const serviceUpdateSchema = serviceSchema.partial().extend({
  id: z.string(),
});

// Schema za filtere (opcionalna polja)
export const serviceFilterSchema = z.object({
  type: z.nativeEnum(ServiceType).optional(),
  isActive: z.boolean().optional(),
  name: z.string().optional(),
});