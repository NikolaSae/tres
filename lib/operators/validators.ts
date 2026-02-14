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

type ZodErrorValue = {
  _errors: string[];
} & Record<string, any>;

export const getOperatorValidationErrors = (errors: z.ZodFormattedError<any>) => {
  const formattedErrors: Record<string, string> = {};
  
  Object.entries(errors).forEach(([key, value]) => {
    // Preskačemo root _errors i proveravamo nested objekte
    if (key !== "_errors" && value && typeof value === "object" && !Array.isArray(value)) {
      const errorValue = value as ZodErrorValue;
      if (errorValue._errors && Array.isArray(errorValue._errors) && errorValue._errors.length > 0) {
        formattedErrors[key] = errorValue._errors[0];
      }
    }
  });
  
  return formattedErrors;
};