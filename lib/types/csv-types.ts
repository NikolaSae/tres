// lib/types/csv-types.ts

/**
 * Tip za jedan red iz CSV fajla za import servisa
 */
export interface ServiceCsvRow {
  name: string;
  type: string;
  description?: string;
  isActive?: boolean | string; // može biti "true"/"false" iz CSV-a
  // Dodaj ostala polja koja očekuješ u CSV-u
  [key: string]: any; // fleksibilno za dodatna polja
}

/**
 * Rezultat importa CSV fajla – generički tip za različite entitete
 */
export interface CsvImportResult<T> {
  totalRows: number;
  validRows: T[];
  invalidRows: Array<{
    rowIndex: number;
    errors: string[];
    originalRow: Record<string, any>;
  }>;
  importErrors: string[];
  error?: string | null;
  createdCount?: number;
  // Dodaj ako treba: updatedCount, skippedDuplicates itd.
}