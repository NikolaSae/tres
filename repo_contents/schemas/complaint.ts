// Path: schemas/complaint.ts

import { z } from "zod";
import { ComplaintStatus } from "@prisma/client"; // Assuming ComplaintStatus enum is imported from Prisma client

// Schema for creating a new complaint (used by the form)
export const ComplaintSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters long" }).max(100),
  description: z.string().min(10, { message: "Description must be at least 10 characters long" }),
   priority: z.number({
    invalid_type_error: "Priority must be a number",
    required_error: "Priority is required",
  }).int({ message: "Priority must be an integer" }).min(1, { message: "Priority must be at least 1" }).max(5, { message: "Priority must be at most 5" }),
  // serviceId, productId, providerId are now optional/nullable in this schema
  serviceId: z.string().optional().nullable(),
  // productId: z.string().optional().nullable(),
  providerId: z.string().optional().nullable(),
  financialImpact: z.number().optional().nullable(),
  // attachments is an optional array of strings (presumably file URLs or similar)
  attachments: z.array(z.string()).optional(),
});

// Schema specifically for importing complaints (e.g., from CSV)
// Note: This schema might have different validation rules or default values
export const ComplaintImportSchema = z.object({
  title: z.string().min(2, { message: "Title is required" }), // Example: less strict validation for import
  description: z.string().min(2, { message: "Description is required" }), // Example: less strict validation for import
  priority: z.number().int().min(1).max(5).default(3), // Example: default priority for imported items
  serviceId: z.string().optional().nullable(),
  // productId: z.string().optional().nullable(),
  providerId: z.string().optional().nullable(),
  financialImpact: z.number().optional().nullable(),
  // Attachments might not be part of the import process, or handled differently
});

// Schema for updating a complaint
// It includes the ID and makes all fields from ComplaintSchema optional
export const complaintUpdateSchema = ComplaintSchema.partial().extend({
    id: z.string().min(1, "Complaint ID is required for update"), // ID is required for updates
    // You can add other specific fields for update here if needed,
    // or override validations from ComplaintSchema.partial()
    // For example, if status can be updated via this schema:
     status: z.nativeEnum(ComplaintStatus).optional(),
});


// Schema for updating the status of a complaint (assuming this is a separate action/route)
export const ComplaintStatusUpdateSchema = z.object({
  status: z.nativeEnum(ComplaintStatus), // Uses the enum from Prisma client
  comment: z.string().optional(), // Optional comment for the status change
});

// Schema for adding a comment to a complaint
export const ComplaintCommentSchema = z.object({
  content: z.string().min(1, { message: "Comment cannot be empty" }).max(1000), // Comment content validation
});

// Schema for filtering complaints (used in API queries or frontend filters)
export const ComplaintFilterSchema = z.object({
  status: z.string().optional(), // Filter by status (string representation of enum)
  priority: z.string().optional().transform(val => val ? parseInt(val) : undefined), // Filter by priority, transforming string to number
  serviceId: z.string().optional(), // Filter by service ID
  providerId: z.string().optional(), // Filter by provider ID
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined), // Filter by start date, transforming string to Date
  endDate: z.string().optional().transform(val => val ? new Date(val) : undefined), // Filter by end date, transforming string to Date
  search: z.string().optional(), // General search term
});

// Type inference for the main complaint form data
export type ComplaintFormData = z.infer<typeof ComplaintSchema>;

// Type inference for other schemas
export type ComplaintUpdateData = z.infer<typeof complaintUpdateSchema>; // Export the type as well
export type ComplaintStatusUpdate = z.infer<typeof ComplaintStatusUpdateSchema>;
export type ComplaintComment = z.infer<typeof ComplaintCommentSchema>;
export type ComplaintFilter = z.infer<typeof ComplaintFilterSchema>;
