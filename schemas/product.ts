// schemas/product.ts
import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(3, "Product name must be at least 3 characters"),
  code: z.string().min(2, "Product code must be at least 2 characters"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

// ✅ FIXED: Export ProductFormData type
export type ProductFormData = z.infer<typeof productSchema>;

export const productUpdateSchema = productSchema.partial().extend({
  id: z.string(),
});

// ✅ Export update type as well
export type ProductUpdateData = z.infer<typeof productUpdateSchema>;

export const productFilterSchema = z.object({
  isActive: z.boolean().optional(),
  name: z.string().optional(),
  code: z.string().optional(),
});

// ✅ Export filter type
export type ProductFilterData = z.infer<typeof productFilterSchema>;