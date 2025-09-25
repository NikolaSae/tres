///lib/contracts/validators.ts

import { z } from "zod";
import { ContractStatus, ContractType } from "@prisma/client";
import { contractSchema } from "@/schemas/contract";
import { ContractFormData } from "@/lib/types/contract-types";

/**
 * Validates if a contract's end date is after its start date
 */
export function validateContractDates(startDate: Date, endDate: Date): boolean {
  return endDate > startDate;
}

/**
 * Checks if a contract is expiring within the specified number of days
 */
export function isContractExpiringSoon(endDate: Date, days: number = 30): boolean {
  const today = new Date();
  const daysInMs = days * 24 * 60 * 60 * 1000;
  return endDate.getTime() - today.getTime() <= daysInMs && endDate > today;
}

/**
 * Validates contract data using the Zod schema
 */
export function validateContractData(data: any): { 
  success: boolean; 
  data?: ContractFormData; 
  errors?: z.ZodFormattedError<ContractFormData>; 
} {
  try {
    const validatedData = contractSchema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.format() };
    }
    throw error;
  }
}

/**
 * Validates a contract based on its type
 */
export function validateContractByType(data: any): { 
  success: boolean; 
  errors?: string[]; 
} {
  const errors: string[] = [];
  
  // Basic validation for all contract types
  if (!data.name || data.name.trim() === "") {
    errors.push("Contract name is required");
  }
  
  if (!data.contractNumber || data.contractNumber.trim() === "") {
    errors.push("Contract number is required");
  }
  
  if (!data.startDate) {
    errors.push("Start date is required");
  }
  
  if (!data.endDate) {
    errors.push("End date is required");
  }
  
  if (data.startDate && data.endDate && new Date(data.endDate) <= new Date(data.startDate)) {
    errors.push("End date must be after start date");
  }
  
  if (data.revenuePercentage === undefined || data.revenuePercentage < 0 || data.revenuePercentage > 100) {
    errors.push("Revenue percentage must be between 0 and 100");
  }
  
  // Type-specific validations
  switch (data.type) {
    case ContractType.PROVIDER:
      if (!data.providerId) {
        errors.push("Provider is required for provider contracts");
      }
      break;
      
    case ContractType.HUMANITARIAN:
      if (!data.humanitarianOrgId) {
        errors.push("Humanitarian organization is required for humanitarian contracts");
      }
      break;
      
    case ContractType.PARKING:
      if (!data.parkingServiceId) {
        errors.push("Parking service is required for parking contracts");
      }
      break;
      
    default:
      errors.push("Invalid contract type");
  }
  
  return {
    success: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Validates a contract reminder
 */
export function validateContractReminder(reminderDate: Date, reminderType: string): {
  success: boolean;
  errors?: string[];
} {
  const errors: string[] = [];
  
  const validReminderTypes = ["expiration", "renewal", "review"];
  
  if (!reminderDate) {
    errors.push("Reminder date is required");
  } else if (reminderDate < new Date()) {
    errors.push("Reminder date cannot be in the past");
  }
  
  if (!reminderType || !validReminderTypes.includes(reminderType)) {
    errors.push(`Reminder type must be one of: ${validReminderTypes.join(', ')}`);
  }
  
  return {
    success: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Validates a contract attachment
 */
export function validateContractAttachment(file: File): {
  success: boolean;
  errors?: string[];
} {
  const errors: string[] = [];
  
  // Check if file exists
  if (!file) {
    errors.push("File is required");
    return {
      success: false,
      errors
    };
  }
  
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > maxSize) {
    errors.push("File size exceeds the 10MB limit");
  }
  
  // Validate file type
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'image/jpeg',
    'image/png'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    errors.push("File type not supported. Please upload PDF, Word, Excel or image files.");
  }
  
  return {
    success: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}