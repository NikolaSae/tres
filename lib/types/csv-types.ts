// lib/types/csv-types.ts - ISPRAVLJEN
export interface ServiceCsvRow {
  name: string;
  description?: string;
  type?: string;
}

export interface CsvRowValidationResult<T> {
  rowIndex: number;
  errors: string[];
  originalRow: Record<string, any>;
  isValid: boolean;
  data: T;  // ✅ Required, ne optional
}

export interface CsvImportResult<T> {
  totalRows: number;
  validRows: T[];
  invalidRows: CsvRowValidationResult<T>[];
  importErrors: string[];
  error?: string | null;
  createdCount?: number;
}