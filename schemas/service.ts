// /schemas/service.ts

import { z } from "zod";
import { ServiceType } from "@prisma/client";

export const serviceSchema = z.object({
name: z.string().min(3, "Service name must be at least 3 characters"),
type: z.nativeEnum(ServiceType),
description: z.string().optional(),
isActive: z.boolean().default(true),
});

export const serviceUpdateSchema = serviceSchema.partial().extend({
id: z.string(),
});

export const serviceFilterSchema = z.object({
type: z.nativeEnum(ServiceType).optional(),
isActive: z.boolean().optional(),
name: z.string().optional(),
});