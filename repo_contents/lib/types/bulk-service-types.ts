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
  providerId: string | null; // providerId can still be null if not found
  serviceId: string | null; // serviceId can still be null during mapping if not found, but will be filtered out
}

// Result for a single CSV row validation
export interface CsvRowValidationResult<T> {
  data: T; // Validated data or original data if validation failed
  errors: string[]; // List of error messages for this row
  isValid: boolean; // True if the row passed validation
  rowIndex: number; // Original 0-based index of the row in the CSV
  originalRow: Record<string, any>; // The original parsed row data
}

// Data structure for detailed CSV import results
export interface BulkServiceImportResult {
  totalRows: number;
  validRows: BulkServiceCSVData[]; // Validated and mapped data ready for DB insertion
  invalidRows: CsvRowValidationResult<BulkServiceCSVData>[]; // Rows that failed validation or mapping
  importErrors: string[]; // Errors at the file parsing level (e.g., malformed CSV)
  error?: string | null; // Overall error message for the import process
  createdCount?: number; // Number of records actually created in the database
  createdServices?: { id: string; name: string }[]; // Polje za novokreirane servise
  // createdProviders?: { id: string; name: string }[]; // UKLONJENO: Polje za novokreirane provajdere
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
  serviceId: string; // Now mandatory
  providerId: string;
}

// Structure for logging bulk service actions
export interface BulkServiceLogData {
  action: string;
  entityId: string;
  details?: string;
  userId: string;
}
