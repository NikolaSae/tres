//lib/parking-services/validators.ts

import { z } from "zod";

/**
 * Validation utilities for parking service data
 */

export const parkingServiceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  contactName: z.string().optional().nullable(),
  email: z.string().email("Invalid email address").optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export type ParkingServiceFormValues = z.infer<typeof parkingServiceSchema>;

/**
 * Validates a parking service form submission
 */
export function validateParkingService(data: unknown) {
  const result = parkingServiceSchema.safeParse(data);
  if (!result.success) {
    // Format the errors for easier use in forms
    const formattedErrors: Record<string, string> = {};
    result.error.errors.forEach((error) => {
      if (error.path.length > 0) {
        formattedErrors[error.path.join(".")] = error.message;
      }
    });
    return { success: false, errors: formattedErrors };
  }
  return { success: true, data: result.data };
}

/**
 * Schema for filtering parking services
 */
export const parkingServiceFilterSchema = z.object({
  name: z.string().optional(),
  isActive: z.boolean().optional(),
  sortBy: z.enum(["name", "createdAt"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
});

export type ParkingServiceFilters = z.infer<typeof parkingServiceFilterSchema>;