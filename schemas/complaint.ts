// Path: schemas/complaint.ts

import { z } from "zod";
import { ComplaintStatus } from "@prisma/client";

// Schema for creating a new complaint (used by the form)
export const ComplaintSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters long" }).max(100),
  description: z.string().min(10, { message: "Description must be at least 10 characters long" }),
  priority: z.number({
    invalid_type_error: "Priority must be a number",
    required_error: "Priority is required",
  }).int({ message: "Priority must be an integer" }).min(1, { message: "Priority must be at least 1" }).max(5, { message: "Priority must be at most 5" }),
  serviceType: z.string().optional(),
  serviceId: z.string().optional().nullable(),
  providerId: z.string().optional().nullable(),
  humanitarianOrgId: z.string().optional().nullable(),
  parkingServiceId: z.string().optional().nullable(),
  financialImpact: z.number().optional().nullable(),
  attachments: z.array(z.string()).optional(),
});

// Schema specifically for importing complaints (e.g., from CSV)
export const ComplaintImportSchema = z.object({
  title: z.string().min(2, { message: "Title is required" }),
  description: z.string().min(2, { message: "Description is required" }),
  priority: z.number().int().min(1).max(5).default(3),
  serviceId: z.string().optional().nullable(),
  providerId: z.string().optional().nullable(),
  financialImpact: z.number().optional().nullable(),
});

// Schema for updating a complaint
export const complaintUpdateSchema = ComplaintSchema.partial().extend({
    id: z.string().min(1, "Complaint ID is required for update"),
    status: z.nativeEnum(ComplaintStatus).optional(),
});

// Schema for updating the status of a complaint
export const ComplaintStatusUpdateSchema = z.object({
  status: z.nativeEnum(ComplaintStatus),
  comment: z.string().optional(),
});

// Schema for adding a comment to a complaint
export const ComplaintCommentSchema = z.object({
  content: z.string().min(1, { message: "Comment cannot be empty" }).max(1000),
});

// Schema for filtering complaints
export const ComplaintFilterSchema = z.object({
  status: z.string().optional(),
  priority: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  serviceId: z.string().optional(),
  providerId: z.string().optional(),
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  search: z.string().optional(),
});

// Type inference for the main complaint form data
export type ComplaintFormData = z.infer<typeof ComplaintSchema>;

// Type inference for other schemas
export type ComplaintUpdateData = z.infer<typeof complaintUpdateSchema>;
export type ComplaintStatusUpdate = z.infer<typeof ComplaintStatusUpdateSchema>;
export type ComplaintComment = z.infer<typeof ComplaintCommentSchema>;
export type ComplaintFilter = z.infer<typeof ComplaintFilterSchema>;
