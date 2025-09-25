// /utils/csv-validator.ts
import { z } from 'zod';
import { ComplaintStatus } from '@prisma/client';
import { parse as csvParse } from 'csv-parse/sync';

export type ValidationError = {
  row: number;
  field: string;
  message: string;
};

export type ValidationResult<T> = {
  isValid: boolean;
  data: T[];
  errors: ValidationError[];
};

// Schema for complaint CSV import
export const ComplaintImportSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  status: z.enum([
    'NEW', 'ASSIGNED', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED', 'REJECTED'
  ] as [ComplaintStatus, ...ComplaintStatus[]]).default('NEW'),
  priority: z.coerce.number().min(1).max(5).default(3),
  financialImpact: z.coerce.number().optional().nullable(),
  serviceId: z.string().optional().nullable(),
  productId: z.string().optional().nullable(),
  providerId: z.string().optional().nullable(),
  submittedById: z.string()
});

export type ComplaintImportData = z.infer<typeof ComplaintImportSchema>;

export function parseAndValidateCsv<T>(
  csvContent: string,
  schema: z.ZodType<T>,
  options: {
    hasHeaderRow?: boolean;
    delimiter?: string;
  } = { hasHeaderRow: true, delimiter: ',' }
): ValidationResult<T> {
  try {
    // Parse CSV to array of objects
    const records = csvParse(csvContent, {
      columns: options.hasHeaderRow,
      skip_empty_lines: true,
      delimiter: options.delimiter,
      trim: true
    });

    const data: T[] = [];
    const errors: ValidationError[] = [];

    // Validate each row
    records.forEach((record: any, index: number) => {
      try {
        const validatedRow = schema.parse(record);
        data.push(validatedRow);
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.errors.forEach(issue => {
            errors.push({
              row: index + (options.hasHeaderRow ? 2 : 1), // +2 to account for header and 0-indexing
              field: issue.path.join('.') || 'unknown',
              message: issue.message
            });
          });
        } else {
          errors.push({
            row: index + (options.hasHeaderRow ? 2 : 1),
            field: 'unknown',
            message: 'Failed to validate row'
          });
        }
      }
    });

    return {
      isValid: errors.length === 0,
      data,
      errors
    };
  } catch (error) {
    return {
      isValid: false,
      data: [],
      errors: [{
        row: 0,
        field: 'file',
        message: error instanceof Error ? error.message : 'Failed to parse CSV file'
      }]
    };
  }
}

// Helper to validate service IDs against database
export async function validateServiceIds(
  data: ComplaintImportData[],
  db: any // Replace with your actual Prisma client type
): Promise<ValidationResult<ComplaintImportData>> {
  if (data.length === 0) {
    return { isValid: true, data, errors: [] };
  }
  
  const errors: ValidationError[] = [];
  const serviceIds = data
    .map(item => item.serviceId)
    .filter((id): id is string => id !== null && id !== undefined);
  
  if (serviceIds.length > 0) {
    const existingServices = await db.service.findMany({
      where: {
        id: { in: serviceIds }
      },
      select: { id: true }
    });
    
    const existingIds = new Set(existingServices.map((s: { id: string }) => s.id));
    
    // Check for non-existent service

    data.forEach((row, index) => {
      if (row.serviceId && !existingIds.has(row.serviceId)) {
        errors.push({
          row: index + 2, // +2 to account for header and 0-indexing
          field: 'serviceId',
          message: `Service ID ${row.serviceId} does not exist`
        });
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    data,
    errors
  };
}

// Helper to validate product IDs against database
export async function validateProductIds(
  data: ComplaintImportData[],
  db: any // Replace with your actual Prisma client type
): Promise<ValidationResult<ComplaintImportData>> {
  if (data.length === 0) {
    return { isValid: true, data, errors: [] };
  }
  
  const errors: ValidationError[] = [];
  const productIds = data
    .map(item => item.productId)
    .filter((id): id is string => id !== null && id !== undefined);
  
  if (productIds.length > 0) {
    const existingProducts = await db.product.findMany({
      where: {
        id: { in: productIds }
      },
      select: { id: true }
    });
    
    const existingIds = new Set(existingProducts.map((p: { id: string }) => p.id));
    
    // Check for non-existent product
    data.forEach((row, index) => {
      if (row.productId && !existingIds.has(row.productId)) {
        errors.push({
          row: index + 2,
          field: 'productId',
          message: `Product ID ${row.productId} does not exist`
        });
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    data,
    errors
  };
}

// Helper to validate provider IDs against database
export async function validateProviderIds(
  data: ComplaintImportData[],
  db: any // Replace with your actual Prisma client type
): Promise<ValidationResult<ComplaintImportData>> {
  if (data.length === 0) {
    return { isValid: true, data, errors: [] };
  }
  
  const errors: ValidationError[] = [];
  const providerIds = data
    .map(item => item.providerId)
    .filter((id): id is string => id !== null && id !== undefined);
  
  if (providerIds.length > 0) {
    const existingProviders = await db.provider.findMany({
      where: {
        id: { in: providerIds }
      },
      select: { id: true }
    });
    
    const existingIds = new Set(existingProviders.map((p: { id: string }) => p.id));
    
    // Check for non-existent provider
    data.forEach((row, index) => {
      if (row.providerId && !existingIds.has(row.providerId)) {
        errors.push({
          row: index + 2,
          field: 'providerId',
          message: `Provider ID ${row.providerId} does not exist`
        });
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    data,
    errors
  };
}

// Helper to validate user IDs against database
export async function validateUserIds(
  data: ComplaintImportData[],
  db: any // Replace with your actual Prisma client type
): Promise<ValidationResult<ComplaintImportData>> {
  if (data.length === 0) {
    return { isValid: true, data, errors: [] };
  }
  
  const errors: ValidationError[] = [];
  const userIds = data.map(item => item.submittedById);
  
  const existingUsers = await db.user.findMany({
    where: {
      id: { in: userIds }
    },
    select: { id: true }
  });
  
  const existingIds = new Set(existingUsers.map((u: { id: string }) => u.id));
  
  // Check for non-existent users
  data.forEach((row, index) => {
    if (row.submittedById && !existingIds.has(row.submittedById)) {
      errors.push({
        row: index + 2,
        field: 'submittedById',
        message: `User ID ${row.submittedById} does not exist`
      });
    }
  });
  
  return {
    isValid: errors.length === 0,
    data,
    errors
  };
}