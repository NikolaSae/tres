///lib/bulk-services/validators.ts

/**
 * Bulk services validation utilities
 * Contains functions for validating bulk service data
 */

import { z } from "zod";
import { BulkServiceSchema } from "@/schemas/bulk-service";
import type { BulkService } from "@prisma/client";

/**
 * Validates bulk service data against the schema
 * @param data The bulk service data to validate
 * @returns Validation result with success flag and either validated data or error message
 */
export const validateBulkService = (data: unknown) => {
  try {
    const validatedData = BulkServiceSchema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map((err) => ({
        path: err.path.join("."),
        message: err.message,
      }));
      return { success: false, error: formattedErrors };
    }
    return { success: false, error: "Invalid data provided" };
  }
};

/**
 * Validates required fields for bulk service creation
 * @param data Partial bulk service data
 * @returns Boolean indicating if all required fields are present
 */
export const hasRequiredFields = (data: Partial<BulkService>): boolean => {
  const requiredFields = [
    "provider_name",
    "agreement_name",
    "service_name",
    "step_name",
    "sender_name",
    "requests",
    "message_parts",
    "serviceId",
    "providerId",
  ];

  return requiredFields.every((field) => {
    return data[field as keyof Partial<BulkService>] !== undefined && 
           data[field as keyof Partial<BulkService>] !== null;
  });
};

/**
 * Validates bulk service data for import from CSV
 * @param data Array of bulk service data from CSV
 * @returns Object containing valid items and error items
 */
export const validateBulkServicesImport = (data: any[]) => {
  const validItems: any[] = [];
  const errorItems: { rowIndex: number; errors: string[] }[] = [];

  data.forEach((item, index) => {
    // Skip empty rows
    if (Object.keys(item).length === 0) return;

    const errors: string[] = [];

    // Check required fields
    if (!item.provider_name) errors.push("Provider name is required");
    if (!item.agreement_name) errors.push("Agreement name is required");
    if (!item.service_name) errors.push("Service name is required");
    if (!item.step_name) errors.push("Step name is required");
    if (!item.sender_name) errors.push("Sender name is required");
    
    // Validate numeric fields
    if (isNaN(Number(item.requests))) {
      errors.push("Requests must be a valid number");
    } else {
      // Convert to number if valid
      item.requests = Number(item.requests);
    }
    
    if (isNaN(Number(item.message_parts))) {
      errors.push("Message parts must be a valid number");
    } else {
      // Convert to number if valid
      item.message_parts = Number(item.message_parts);
    }

    if (errors.length > 0) {
      errorItems.push({ rowIndex: index + 1, errors });
    } else {
      validItems.push(item);
    }
  });

  return { validItems, errorItems };
};

/**
 * Checks if a bulk service record already exists in the database
 * Based on the unique constraint fields
 * @param newData The bulk service data to check
 * @param existingData Array of existing bulk services to check against
 * @returns Boolean indicating if the record is a duplicate
 */
export const isDuplicate = (
  newData: Partial<BulkService>,
  existingData: Partial<BulkService>[]
): boolean => {
  return existingData.some((existing) => {
    return (
      existing.provider_name === newData.provider_name &&
      existing.agreement_name === newData.agreement_name &&
      existing.service_name === newData.service_name &&
      existing.sender_name === newData.sender_name &&
      existing.requests === newData.requests &&
      existing.message_parts === newData.message_parts
    );
  });
};