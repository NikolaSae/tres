// lib/services/csv-processor.ts
import { parse } from 'csv-parse/sync';
import { ServiceCsvRow, CsvRowValidationResult, CsvImportResult } from '@/lib/types/csv-types';
import { serviceSchema, ServiceFormData } from '@/schemas/service';
import { productSchema, ProductFormData } from '@/schemas/product';
import { ServiceType } from '@prisma/client';

function parseCsvContent(csvContent: string): any[] {
    try {
        const records: any[] = parse(csvContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        });
        return records;
    } catch (error) {
        console.error("Error parsing CSV content:", error);
        throw new Error(`Failed to parse CSV content: ${error instanceof Error ? error.message : String(error)}`);
    }
}

function validateServiceCsvRow(row: any, rowIndex: number): CsvRowValidationResult<ServiceFormData> {
    const rowData = {
        name: row.name,
        type: row.type,
        description: row.description || undefined,
        isActive: row.isActive,
    };

    const validationResult = serviceSchema.safeParse(rowData);

    if (validationResult.success) {
        return {
            data: validationResult.data,
            errors: [],
            isValid: true,
            rowIndex: rowIndex,
            originalRow: row,
        };
    } else {
        const errors = validationResult.error.errors.map(err => `${err.path.join('.')} - ${err.message}`);
        return {
            data: rowData as ServiceFormData,
            errors: errors,
            isValid: false,
            rowIndex: rowIndex,
            originalRow: row,
        };
    }
}

function validateProductCsvRow(row: any, rowIndex: number): CsvRowValidationResult<ProductFormData> {
    const rowData = {
        name: row.name,
        code: row.code,
        description: row.description || undefined,
        isActive: row.isActive,
    };

    const validationResult = productSchema.safeParse(rowData);

    if (validationResult.success) {
        return {
            data: validationResult.data,
            errors: [],
            isValid: true,
            rowIndex: rowIndex,
            originalRow: row,
        };
    } else {
        const errors = validationResult.error.errors.map(err => `${err.path.join('.')} - ${err.message}`);
        return {
            data: rowData as ProductFormData,
            errors: errors,
            isValid: false,
            rowIndex: rowIndex,
            originalRow: row,
        };
    }
}

export function processServiceCsv(csvContent: string): CsvImportResult<ServiceFormData> {
    const results: CsvImportResult<ServiceFormData> = {
        totalRows: 0,
        validRows: [],
        invalidRows: [],
        importErrors: [],
    };

    try {
        const records = parseCsvContent(csvContent);
        results.totalRows = records.length;

        for (const [index, record] of records.entries()) {
            const validationResult = validateServiceCsvRow(record, index);
            if (validationResult.isValid) {
                results.validRows.push(validationResult.data as ServiceFormData);
            } else {
                results.invalidRows.push(validationResult);
            }
        }

    } catch (error) {
        results.importErrors.push(`Failed to process service CSV: ${error instanceof Error ? error.message : String(error)}`);
        console.error("Error processing service CSV:", error);
    }

    return results;
}

export function processProductCsv(csvContent: string): CsvImportResult<ProductFormData> {
    const results: CsvImportResult<ProductFormData> = {
        totalRows: 0,
        validRows: [],
        invalidRows: [],
        importErrors: [],
    };

    try {
        const records = parseCsvContent(csvContent);
        results.totalRows = records.length;

        for (const [index, record] of records.entries()) {
            const validationResult = validateProductCsvRow(record, index);
            if (validationResult.isValid) {
                results.validRows.push(validationResult.data as ProductFormData);
            } else {
                results.invalidRows.push(validationResult);
            }
        }

    } catch (error) {
        results.importErrors.push(`Failed to process product CSV: ${error instanceof Error ? error.message : String(error)}`);
        console.error("Error processing product CSV:", error);
    }

    return results;
}