//lib/types/bulk-service-types.ts
import { BulkService, Provider, Service } from "@prisma/client";

// Enhanced types with relations
export interface BulkServiceWithRelations extends BulkService {
  provider: Provider;
  service: Service;
}

// Filters for bulk services
export interface BulkServiceFilters {
  providerId?: string;
  serviceId?: string;
  providerName?: string;
  serviceName?: string;
  senderName?: string;
  startDate?: Date;
  endDate?: Date;
}

// Statistics for bulk services
export interface BulkServiceStats {
  totalRequests: number;
  totalMessageParts: number;
  providerDistribution: {
    providerId: string;
    providerName: string;
    requestCount: number;
    messagePartCount: number;
    percentage: number;
  }[];
  serviceDistribution: {
    serviceId: string;
    serviceName: string;
    requestCount: number;
    messagePartCount: number;
    percentage: number;
  }[];
  timeSeriesData?: {
    date: string;
    requests: number;
    messageParts: number;
  }[];
}

// Structure for bulk service CSV row
export interface BulkServiceCSVData {
  provider_name: string;
  agreement_name: string;
  service_name: string;
  step_name: string;
  sender_name: string;
  requests: number;
  message_parts: number;
  providerId: string | null;
  serviceId: string | null;
}

// Alias for compatibility
export interface BulkServiceData extends BulkServiceCSVData {}

// Validation error structure (backward compatibility)
export interface BulkServiceValidationError {
  rowIndex: number;
  errors: string[];
  originalRow: Record<string, any>;
}

// Result for a single CSV row validation
export interface CsvRowValidationResult<T> {
  data: T;
  errors: string[];
  isValid: boolean;
  rowIndex: number;
  originalRow: Record<string, any>;
}

// Data structure for detailed CSV import results
export interface BulkServiceImportResult {
  totalRows: number;
  validRows: BulkServiceCSVData[];
  // ✅ Prihvata oba tipa za maksimalnu fleksibilnost
  invalidRows: (CsvRowValidationResult<BulkServiceCSVData> | BulkServiceValidationError)[];
  importErrors: string[];
  error?: string | null;
  createdCount?: number;
  updatedCount?: number;
  createdServices?: { id: string; name: string }[];
}

// Response structure for paginated bulk services
export interface PaginatedBulkServices {
  data: BulkServiceWithRelations[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form submission data structure
export interface BulkServiceFormValues {
  provider_name: string;
  agreement_name: string;
  service_name: string;
  step_name: string;
  sender_name: string;
  requests: number;
  message_parts: number;
  serviceId: string;
  providerId: string;
}

// Structure for logging bulk service actions
export interface BulkServiceLogData {
  action: string;
  entityId: string;
  details?: string;
  userId: string;
}

// ✅ Helper type guard za proveru tipa
export function isCsvRowValidationResult(
  item: CsvRowValidationResult<BulkServiceCSVData> | BulkServiceValidationError
): item is CsvRowValidationResult<BulkServiceCSVData> {
  return 'data' in item && 'isValid' in item;
}

export function isBulkServiceValidationError(
  item: CsvRowValidationResult<BulkServiceCSVData> | BulkServiceValidationError
): item is BulkServiceValidationError {
  return !('data' in item) && !('isValid' in item);
}