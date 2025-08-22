//schemas/parking-service.ts

import { z } from "zod";

// Schema for validating new parking service creation
export const createParkingServiceSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  contactName: z.string().max(100, "Contact name must be less than 100 characters").optional(),
  email: z
    .string()
    .email("Please enter a valid email address")
    .max(100, "Email must be less than 100 characters")
    .optional()
    .nullable(),
  phone: z
    .string()
    .max(20, "Phone number must be less than 20 characters")
    .optional()
    .nullable(),
  address: z
    .string()
    .max(200, "Address must be less than 200 characters")
    .optional()
    .nullable(),
  additionalEmails: z.array(z.string().email("Invalid email format")).optional().default([]),
  isActive: z.boolean().optional().default(true),
});

// Schema for updating an existing parking service
export const updateParkingServiceSchema = createParkingServiceSchema
  .partial()
  .extend({
    id: z.string().min(1, "Parking service ID is required"),
  });

// Schema for filtering parking services
export const parkingServiceFiltersSchema = z.object({
  searchTerm: z.string().optional(),
  isActive: z.boolean().optional(),
  sortBy: z.enum(["name", "createdAt", "updatedAt", "lastImportDate"]).optional().default("name"),
  sortDirection: z.enum(["asc", "desc"]).optional().default("asc"),
  page: z.number().int().positive().optional().default(1),
  pageSize: z.number().int().positive().optional().default(10),
  hasImportedFiles: z.boolean().optional(),
});

// Type for parkingServiceFiltersSchema
export type ParkingServiceFiltersInput = z.infer<typeof parkingServiceFiltersSchema>;

// Type for createParkingServiceSchema
export type CreateParkingServiceInput = z.infer<typeof createParkingServiceSchema>;

// Type for updateParkingServiceSchema
export type UpdateParkingServiceInput = z.infer<typeof updateParkingServiceSchema>;