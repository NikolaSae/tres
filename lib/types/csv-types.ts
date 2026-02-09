// lib/types/csv-types.ts

export interface ServiceCsvRow {
  name: string;
  // ostala polja koja imaš u CSV-u, npr:
  description?: string;
  type?: string;
  // ...
}

export interface CsvRowValidationResult<T> {
  rowIndex: number;
  errors: string[];
  originalRow: Record<string, any>;
  isValid: boolean;           // ← DODATO OVO POLJE
  data?: T;                   // opciono, ako želiš validirani objekat posle validacije
}

export interface CsvImportResult<T> {
  totalRows: number;
  validRows: T[];
  invalidRows: CsvRowValidationResult<T>[];
  importErrors: string[];
  error?: string | null;
  createdCount?: number;      // opciono, ako koristiš createMany
}