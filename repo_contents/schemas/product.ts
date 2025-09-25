// /schemas/product.ts

import { z } from "zod";

export const productSchema = z.object({

name: z.string().min(3, "Product name must be at least 3 characters"),

code: z.string().min(2, "Product code must be at least 2 characters"),

description: z.string().optional(),

isActive: z.boolean().default(true),

});

export const productUpdateSchema = productSchema.partial().extend({

id: z.string(),

});

export const productFilterSchema = z.object({

isActive: z.boolean().optional(),

name: z.string().optional(),

code: z.string().optional(),

});