// actions/services/import.ts
'use server';

import { db } from '@/lib/db';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { ServiceCsvRow, CsvImportResult } from '@/lib/types/csv-types';
import { serviceSchema, ServiceFormData } from '@/schemas/service';
import { processServiceCsv } from '@/lib/services/csv-processor';
import { auth } from '@/auth';
import { currentRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export async function importServices(csvContent: string): Promise<CsvImportResult<ServiceFormData> & { error: string | null }> {
  const role = await currentRole();
  if (role !== UserRole.ADMIN && role !== UserRole.MANAGER) {
    return { totalRows: 0, validRows: [], invalidRows: [], importErrors: [], error: "Forbidden" };
  }

  const processingResult = processServiceCsv(csvContent);

  if (processingResult.importErrors.length > 0) {
    return { ...processingResult, error: "Failed to process service CSV file." };
  }

  if (processingResult.validRows.length === 0) {
    return { ...processingResult, error: processingResult.invalidRows.length > 0 ? "No valid rows found for import." : null };
  }

  try {
    const existingServiceNames = await db.service.findMany({
      where: {
        name: { in: processingResult.validRows.map(row => row.name) }
      },
      select: { name: true }
    });
    const existingNamesSet = new Set(existingServiceNames.map(s => s.name));

    const rowsToCreate = processingResult.validRows.filter(row => !existingNamesSet.has(row.name));
    const duplicateRows = processingResult.validRows.filter(row => existingNamesSet.has(row.name));

    duplicateRows.forEach(row => {
      const originalRecords = parse(csvContent, { columns: true, skip_empty_lines: true, trim: true });
      const rowIndex = originalRecords.findIndex((rec: any) => rec.name === row.name);
      const originalRow = rowIndex !== -1 ? originalRecords[rowIndex] : {};

      processingResult.invalidRows.push({
        originalRow: originalRow,           // ← ispravljeno: originalRow umesto data
        errors: ["Service with this name already exists."],
        isValid: false,
        rowIndex: rowIndex !== -1 ? rowIndex + 1 : -1,
      });
    });

    let createdCount = 0;
    if (rowsToCreate.length > 0) {
      const createManyResult = await db.service.createMany({
        data: rowsToCreate,
        skipDuplicates: true,
      });
      createdCount = createManyResult.count;
    }

    return {
      totalRows: processingResult.totalRows,
      validRows: rowsToCreate,
      invalidRows: processingResult.invalidRows,
      importErrors: processingResult.importErrors,
      error: processingResult.invalidRows.length > 0 || processingResult.importErrors.length > 0 ? "Import completed with errors or skipped duplicates." : null,
      createdCount,
    };

  } catch (error) {
    console.error("Error during database insert in service import action:", error);
    processingResult.importErrors.push(`Database error during import: ${error instanceof Error ? error.message : String(error)}`);
    return { ...processingResult, error: "Failed to import services due to a database error." };
  }
}