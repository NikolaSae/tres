// /schemas/humanitarian-org.ts
import { z } from 'zod';

export const humanitarianOrgSchema = z.object({
  id: z.string().cuid("Invalid organization ID format").optional(),
  name: z.string().min(1, { message: "Organization name is required" }),
  contactName: z.string().nullable().optional(),
  email: z.string().email("Invalid email format").or(z.literal('')).nullable().optional().transform(e => e === "" ? null : e),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  website: z.string().url("Invalid website URL format").or(z.literal('')).nullable().optional().transform(e => e === "" ? null : e),
  mission: z.string().nullable().optional(),
  isActive: z.boolean({
    invalid_type_error: "Active status must be true or false",
  }).default(true),
  
  // New fields
  pib: z.string()
    .regex(/^\d{8,9}$/, "PIB must be 8-9 digits")
    .nullable()
    .optional()
    .transform(v => v || null),  // Convert empty string to null
  registrationNumber: z.string()
    .min(8, "Registration number must be at least 8 characters")
    .max(13, "Registration number can't exceed 13 characters")
    .nullable()
    .optional()
    .transform(v => v || null),
  bank: z.string()
    .max(100, "Bank name too long (max 100 characters)")
    .nullable()
    .optional()
    .transform(v => v || null),
  accountNumber: z.string()
    .min(18, "Account number must be at least 18 characters")
    .max(25, "Account number can't exceed 25 characters")
    .nullable()
    .optional()
    .transform(v => v || null),
  shortNumber: z.string()
    .max(10, "Short number can't exceed 10 characters")
    .nullable()
    .optional()
    .transform(v => v || null),
});

export type HumanitarianOrgFormData = z.infer<typeof humanitarianOrgSchema>;