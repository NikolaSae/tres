// /lib/services/csv-processor.ts
// Utilitiji za parsiranje i validaciju CSV fajlova za import servisa i proizvoda

import { parse } from 'csv-parse/sync'; // Koristimo sync parser
// Uvozimo potrebne tipove
import { ServiceCsvRow, ProductCsvRow, CsvRowValidationResult, CsvImportResult } from '@/lib/types/csv-types';
// Uvozimo Zod šeme za validaciju protiv očekivanog formata
import { serviceSchema, ServiceFormData } from '@/schemas/service';
import { productSchema, ProductFormData } from '@/schemas/product';
// Uvozimo enume ili tipove ako su potrebni za specifične provere (npr. ServiceType)
import { ServiceType } from '@prisma/client'; // Uvozimo ServiceType iz Prisma klijenta

/**
 * Parsira CSV sadržaj u niz JavaScript objekata.
 * @param csvContent - Sadržaj CSV fajla kao string.
 * @returns Niz objekata koji reprezentuju redove CSV-a.
 */
function parseCsvContent(csvContent: string): any[] {
    try {
        // Prilagodite opcije parsera prema formatu vašeg CSV-a
        const records: any[] = parse(csvContent, {
            columns: true, // Očekujemo red headera i koristimo nazive kolona kao ključeve
            skip_empty_lines: true,
            trim: true,
            // delimiter: ',', // Podrazumevano je zarez
            // ... druge opcije parse biblioteke
        });
        return records;
    } catch (error) {
        console.error("Error parsing CSV content:", error);
        throw new Error(`Failed to parse CSV content: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Validira i transformiše jedan red CSV-a za Servis prema serviceSchema.
 * @param row - Objekat koji reprezentuje jedan red iz CSV-a (nakon parsiranja).
 * @param rowIndex - Index reda (radi lakšeg debagovanja).
 * @returns Rezultat validacije za jedan red.
 */
function validateServiceCsvRow(row: any, rowIndex: number): CsvRowValidationResult<ServiceFormData> {
    // Mapiranje CSV kolona na očekivani format (u ServiceFormData)
    // Nazivi ključeva u `row` objektu zavise od naziva kolona u vašem CSV headeru.
    // Proverite da li se nazivi kolona u vašem CSV-u poklapaju sa ovim ključevima (name, type, description, isActive)
    const rowData = {
        // Očekujemo kolonu "name" u CSV-u
        name: row.name,
        // Očekujemo kolonu "type" u CSV-u koja sadrži validnu ServiceType vrednost (npr. "VAS", "BULK")
        type: row.type,
        // Očekujemo kolonu "description" u CSV-u (opciono)
        description: row.description || undefined, // Parsiranje opcionalnih polja
        // Očekujemo kolonu "isActive" u CSV-u koja sadrži "true" ili "false" string
        // Zod šema će preprocessirati ovaj string u boolean
        isActive: row.isActive,
        // Ako vaš CSV ima polja koja nisu u serviceSchema (npr. vasParameters), ignorišemo ih ovde
        // ili ih sakupljamo ako treba da budu tretirana van osnovne šeme
    };

    // Validacija reda koristeći Zod šemu
    const validationResult = serviceSchema.safeParse(rowData); // Koristimo safeParse

    if (validationResult.success) {
         // Dodatne provere koje Zod šema ne pokriva (npr. provera referencijalnog integriteta ako je potrebno)
         // const additionalErrors = checkServiceRowReferences(validationResult.data); // Ako imate ovakvu funkciju

         // if (additionalErrors.length === 0) {
              return {
                  data: validationResult.data,
                  errors: [],
                  isValid: true,
                  rowIndex: rowIndex,
                  originalRow: row,
              };
         // } else {
         //      return {
         //          data: validationResult.data,
         //          errors: additionalErrors,
         //          isValid: false,
         //          rowIndex: rowIndex,
         //          originalRow: row,
         //      };
         // }
    } else {
        // Sakupljanje grešaka iz Zod validacije
        const errors = validationResult.error.errors.map(err => `${err.path.join('.')} - ${err.message}`);
        return {
            // Vraćamo originalne podatke reda, ali tipizovane na ProductFormData radi konzistentnosti
            // (čak i ako su podaci nevalidni, struktura je očekivana)
            data: rowData as ServiceFormData,
            errors: errors,
            isValid: false,
            rowIndex: rowIndex,
            originalRow: row,
        };
    }
}


/**
 * Validira i transformiše jedan red CSV-a za Proizvod prema productSchema.
 * @param row - Objekat koji reprezentuje jedan red iz CSV-a.
 * @param rowIndex - Index reda.
 * @returns Rezultat validacije za jedan red.
 */
function validateProductCsvRow(row: any, rowIndex: number): CsvRowValidationResult<ProductFormData> {
    // Mapiranje CSV kolona na očekivani format (u ProductFormData)
    // Usklađeno sa Product modelom u vašoj schema.prisma (name, code, description, isActive)
    const rowData = {
        // Očekujemo kolonu "name" u CSV-u
        name: row.name,
        // Očekujemo kolonu "code" u CSV-u - BITNO: Ovo polje je unique i obavezno u bazi
        code: row.code,
        // Očekujemo kolonu "description" u CSV-u (opciono)
        description: row.description || undefined,
        // Očekujemo kolonu "isActive" u CSV-u koja sadrži "true" ili "false" string
        isActive: row.isActive,
        // Ako vaš CSV ima polja koja nisu u productSchema (npr. price), ignorišemo ih
    };

     // Validacija reda koristeći Zod šemu
    const validationResult = productSchema.safeParse(rowData);

    if (validationResult.success) {
          // Dodatne provere (npr. provera referenci ka servisima ako bi ih bilo)
         // const additionalErrors = checkProductRowReferences(validationResult.data);

         // if (additionalErrors.length === 0) {
             return {
                 data: validationResult.data,
                 errors: [],
                 isValid: true,
                 rowIndex: rowIndex,
                 originalRow: row,
             };
         // } else {
         //      return {
         //          data: validationResult.data,
         //          errors: additionalErrors,
         //          isValid: false,
         //          rowIndex: rowIndex,
         //          originalRow: row,
         //      };
         // }
    } else {
        // Sakupljanje grešaka iz Zod validacije
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


/**
 * Procesira kompletan CSV sadržaj za Servise: parsira, validira red po red.
 * @param csvContent - Sadržaj CSV fajla za servise.
 * @returns Sumarni rezultat importa.
 */
export function processServiceCsv(csvContent: string): CsvImportResult<ServiceFormData> {
    const results: CsvImportResult<ServiceFormData> = {
        totalRows: 0,
        validRows: [],
        invalidRows: [],
        importErrors: [], // Greške na nivou celog fajla
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

/**
 * Procesira kompletan CSV sadržaj za Proizvode: parsira, validira red po red.
 * @param csvContent - Sadržaj CSV fajla za proizvode.
 * @returns Sumarni rezultat importa.
 */
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

// Helper funkcije za dodatne provere (ako su potrebne)
// async function checkServiceRowReferences(data: ServiceFormData): Promise<string[]> { ... }
// async function checkProductRowReferences(data: ProductFormData): Promise<string[]> { ... }