// /actions/services/import.ts
'use server';

import { db } from '@/lib/db';
// Uvozimo sync parser i stringifier
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
// Uvozimo ažurirane tipove
import { ServiceCsvRow, CsvImportResult } from '@/lib/types/csv-types';
// Uvozimo ažuriranu Zod šemu za validaciju i tip
import { serviceSchema, ServiceFormData } from '@/schemas/service';
// Uvozimo ažurirani CSV procesor
import { processServiceCsv } from '@/lib/services/csv-processor'; // Koristimo funkciju iz procesora
// Uvozimo auth funkcije za proveru autentifikacije/autorizacije
import { auth } from '@/auth';
import { currentRole } from "@/lib/auth";
import { UserRole } from "@prisma/client"; // Koristimo UserRole enum iz Prisma klijenta


/**
 * Server akcija za import servisa/usluga iz CSV fajla.
 * Prihvata CSV sadržaj kao string, parsira, validira i unosi u bazu.
 * Usklađena sa Service modelom u schema.prisma i ažuriranom serviceSchema.
 * @param csvContent - Sadržaj CSV fajla kao string.
 * @returns Objekat sa rezultatima importa (uspešni/neuspeli redovi, greške).
 */
export async function importServices(csvContent: string): Promise<CsvImportResult<ServiceFormData> & { error: string | null }> {
    // Provera autorizacije - samo ADMIN ili MANAGER mogu importovati
     const role = await currentRole();
     if (role !== UserRole.ADMIN && role !== UserRole.MANAGER) { // Prilagodite uloge
       return { totalRows: 0, validRows: [], invalidRows: [], importErrors: [], error: "Forbidden" };
     }

    // Koristimo ažuriranu funkciju processServiceCsv iz lib/services/csv-processor.ts
    const processingResult = processServiceCsv(csvContent);

    // Ako ima grešaka na nivou parsiranja fajla, vraćamo ih odmah
    if (processingResult.importErrors.length > 0) {
         return { ...processingResult, error: "Failed to process service CSV file." };
    }

    // Ako nema validnih redova za unos, vraćamo rezultat validacije
    if (processingResult.validRows.length === 0) {
        return { ...processingResult, error: processingResult.invalidRows.length > 0 ? "No valid rows found for import." : null };
    }

    try {
        // Unos validnih podataka u bazu koristeći createMany za efikasnost
        // BITNO: createMany NE pokreće individualne validacije i NE baca grešku na prvom neuspehu Unique constraint!
        // Unique constraint (na 'name' u Service modelu) će biti uhvaćen na nivou baze.
        // Ako želite preciznije rukovanje duplikatima ILI ako Service name NIJE unique,
        // koristite transakciju sa individualnim db.service.create pozivima i proverite unique constraint ručno
        // ILI koristite `skipDuplicates: true` ako je 'name' JEDINO unique polje i želite da preskočite duplikate.

        // Provera da li ime servisa već postoji pre unosa - bolja kontrola duplikata nego skipDuplicates: true
        const existingServiceNames = await db.service.findMany({
            where: {
                name: { in: processingResult.validRows.map(row => row.name) }
            },
            select: { name: true }
        });
        const existingNamesSet = new Set(existingServiceNames.map(s => s.name));

        const rowsToCreate = processingResult.validRows.filter(row => !existingNamesSet.has(row.name));
        const duplicateRows = processingResult.validRows.filter(row => existingNamesSet.has(row.name));

        // Dodajemo duplikate na listu neuspelih redova
        duplicateRows.forEach(row => {
            // Pronalazimo originalni red u records da bismo dobili rowIndex i originalRow
             const originalRecord = parse(csvContent, { columns: true, skip_empty_lines: true, trim: true }).find((rec: any) => rec.name === row.name);
             const rowIndex = originalRecord ? parse(csvContent, { columns: true, skip_empty_lines: true, trim: true }).indexOf(originalRecord) : -1; // Pronalaženje indexa

            processingResult.invalidRows.push({
                 data: row,
                 errors: ["Service with this name already exists."],
                 isValid: false,
                 rowIndex: rowIndex,
                 originalRow: originalRecord, // Originalni red iz CSV-a
            });
        });


        let createdCount = 0;
        if (rowsToCreate.length > 0) {
             // Koristimo createMany za preostale, validne i jedinstvene zapise
             // Pošto smo proverili duplikate, skipDuplicates: true više nije neophodan za Unique constraint,
             // ali može biti koristan ako ima duplikata unutar SAMOG CSV FAJLA.
            const createManyResult = await db.service.createMany({
                data: rowsToCreate,
                 skipDuplicates: true, // Ovo će preskočiti duplikate unutar samog CSV fajla ako 'name' nije unique u bazi, ili druge unique polja
            });
            createdCount = createManyResult.count;
        }

        // Vraćanje sumarnog rezultata importa
        // Broj uspešnih redova je broj redova koje smo pokušali da kreiramo (rowsToCreate.length) MINUS oni koji su možda preskočeni zbog DIPLIKATA UNUTAR CSV FAJLA ako je skipDuplicates: true.
        // Najbolje je vratiti count iz createManyResult.
         return {
             totalRows: processingResult.totalRows,
             validRows: rowsToCreate, // Vraćamo listu redova koji su prošli validaciju i proveru duplikata
             invalidRows: processingResult.invalidRows, // Lista redova sa greškama validacije + duplikati
             importErrors: processingResult.importErrors,
             error: processingResult.invalidRows.length > 0 || processingResult.importErrors.length > 0 ? "Import completed with errors or skipped duplicates." : null,
             // Dodatni detalj: koliko ih je zaista kreirano u bazi
              createdCount: createdCount, // Broj kreiranih zapisa
         };


    } catch (error) {
        console.error("Error during database insert in service import action:", error);
         // Rukovanje greškama baze koje nisu uhvaćene ranije (npr. Foreign key ako postoji)
        processingResult.importErrors.push(`Database error during import: ${error instanceof Error ? error.message : String(error)}`);
        return { ...processingResult, error: "Failed to import services due to a database error." };
    }
}