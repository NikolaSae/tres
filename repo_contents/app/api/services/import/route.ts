// /app/api/services/import/route.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// Uvozimo ažuriranu Server Akciju za import
import { importServices } from '@/actions/services/import'; // Koristimo ažuriranu akciju
// Uvozimo auth funkcije za proveru autentifikacije/autorizacije
import { auth } from '@/auth';
import { currentRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";

// Handler za POST za import servisa iz CSV-a
// Koristi ažuriranu actions/services/import.ts akciju
export async function POST(request: NextRequest): Promise<NextResponse> { // Vraća NextResponse
    // Provera autorizacije - samo ADMIN ili MANAGER mogu importovati
     const role = await currentRole();
     if (role !== UserRole.ADMIN && role !== UserRole.MANAGER) { // Prilagodite uloge
       return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
     }

    try {
        // Čitanje tela zahteva kao teksta (očekujemo CSV string)
        // Alternativno, ako se šalje kao 'multipart/form-data' sa fajlom, treba drugačije čitati telo
        const csvContent = await request.text(); // Čitamo kao plain text

        if (!csvContent) {
             return NextResponse.json({ error: "No CSV content provided." }, { status: 400 });
        }

        // Pozivanje AŽURIRANE Server Akcije za import
        const result = await importServices(csvContent);

        // Vraćanje odgovora sa rezultatima importa
        // Status može biti 200 OK čak i ako ima neuspelih redova, ako je procesiranje uspešno.
        // Status 400 bi bio za greške na nivou fajla (parsiranja).
        const status = result.importErrors.length > 0 ? 400 : 200;

        return NextResponse.json({
             success: result.error === null ? `Import completed. ${result.validRows.length} rows processed successfully, ${result.invalidRows.length} rows failed.` : undefined, // success samo ako nema opšte greške
             error: result.error, // Opšta greška importa
             validCount: result.validRows.length,
             invalidCount: result.invalidRows.length,
             invalidRows: result.invalidRows, // Vraćamo detalje o neuspelim redovima
             importErrors: result.importErrors, // Greške na nivou fajla
             createdCount: (result as any).createdCount, // Broj stvarno kreiranih iz akcije
        }, { status });

    } catch (error) {
        console.error("Error during service import via API:", error);
        // Generalna greška servera
        return NextResponse.json({ error: "Failed to process service import." }, { status: 500 });
    }
}

// OPTIONS handler je često potreban za CORS prefetch za POST
export async function OPTIONS() {
    return NextResponse.json({}, { status: 200 });
}