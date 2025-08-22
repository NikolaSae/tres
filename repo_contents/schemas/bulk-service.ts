//schemas/bulk-service.ts

import { z } from "zod";

// Basic validation schema for bulk service
export const bulkServiceSchema = z.object({
  provider_name: z.string()
    .min(1, "Provider name is required"),
  
  agreement_name: z.string()
    .min(1, "Agreement name is required"),
  
  service_name: z.string()
    .min(1, "Service name is required"),
  
  step_name: z.string() 
    .min(1, "Step name is required"),
  
  sender_name: z.string()
    .min(1, "Sender name is required"),
  
  requests: z.coerce.number()
    .int("Requests must be an integer")
    .min(0, "Requests must be a non-negative number"),
  
  message_parts: z.coerce.number()
    .int("Message parts must be an integer")
    .min(0, "Message parts must be a non-negative number"),
  
  serviceId: z.string().uuid("Invalid service ID"),
  
  providerId: z.string().uuid("Invalid provider ID"),
});

// Extended validation schema for bulk service with optional fields (for updates)
export const bulkServiceUpdateSchema = bulkServiceSchema.partial();

// Schema for bulk service filters
export const bulkServiceFiltersSchema = z.object({
  providerId: z.string().optional(),
  serviceId: z.string().optional(),
  providerName: z.string().optional(),
  serviceName: z.string().optional(),
  senderName: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

// CSV import validation schema
export const bulkServiceCSVRowSchema = z.object({
  provider_name: z.string().min(1, "Provider name is required"),
  agreement_name: z.string().min(1, "Agreement name is required"),
  service_name: z.string().min(1, "Service name is required"),
  step_name: z.string().min(1, "Step name is required"),
  sender_name: z.string().min(1, "Sender name is required"),
  requests: z.string().transform((val) => {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed)) throw new Error("Requests must be a number");
    return parsed;
  }),
  message_parts: z.string().transform((val) => {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed)) throw new Error("Message parts must be a number");
    return parsed;
  }),
});

// CSV import validation schema for the entire file
export const bulkServiceCSVSchema = z.array(bulkServiceCSVRowSchema);

export const bulkServiceSearchParamsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  providerId: z.string().optional(),
  serviceId: z.string().optional(),
  providerName: z.string().optional(),
  serviceName: z.string().optional(),
  senderName: z.string().optional(),
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
});

export type BulkServiceFormData = z.infer<typeof bulkServiceSchema>;
export type BulkServiceUpdateData = z.infer<typeof bulkServiceUpdateSchema>;
export type BulkServiceFiltersData = z.infer<typeof bulkServiceFiltersSchema>;
export type BulkServiceCSVRow = z.infer<typeof bulkServiceCSVRowSchema>;
export type BulkServiceSearchParams = z.infer<typeof bulkServiceSearchParamsSchema>;