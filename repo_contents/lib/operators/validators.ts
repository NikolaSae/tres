// lib/operators/validators.ts

import { z } from "zod";
import { operatorSchema } from "@/schemas/operator";

export const validateOperator = (data: unknown) => {
  return operatorSchema.safeParse(data);
};

export const validateOperatorCode = (code: string) => {
  const codeSchema = z.string().min(2).max(20).regex(/^[a-zA-Z0-9_-]+$/);
  return codeSchema.safeParse(code);
};

export const validateOperatorEmail = (email: string | null | undefined) => {
  if (!email) return { success: true };
  const emailSchema = z.string().email();
  return emailSchema.safeParse(email);
};

export const validateOperatorWebsite = (website: string | null | undefined) => {
  if (!website) return { success: true };
  const websiteSchema = z.string().url();
  return websiteSchema.safeParse(website);
};

export const getOperatorValidationErrors = (errors: z.ZodFormattedError<any>) => {
  const formattedErrors: Record<string, string> = {};
  
  Object.entries(errors).forEach(([key, value]) => {
    if (key !== "_errors" && value.hasOwnProperty("_errors") && Array.isArray(value._errors) && value._errors.length > 0) {
      formattedErrors[key] = value._errors[0];
    }
  });
  
  return formattedErrors;
};