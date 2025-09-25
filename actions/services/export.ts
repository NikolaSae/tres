// /actions/services/export.ts
'use server';

import { db } from '@/lib/db';
// Uvozimo sync stringifier
import { stringify } from 'csv-stringify/sync';
// Uvozimo ažurirane tipove
import { ServiceWithDetails, ServiceFilterOptions } from '@/lib/types/service-types';
// Uvozimo auth funkcije za proveru autentifikacije/autorizacije
import { auth } from '@/auth';
import { currentRole } from "@/lib/auth";
import { UserRole } from "@prisma/client"; // Koristimo UserRole enum iz Prisma klijenta


/**
 * Server akcija za export servisa/usluga u CSV formatu.
 * Prihvata filtere kako bi se odredilo koji servisi se exportuju.
 * Usklađena sa Service modelom u schema.prisma.
 * @param filters - Opcije filtera za export.
 * @returns Sadržaj CSV fajla kao string ili grešku.
 */
export async function exportServices(filters: ServiceFilterOptions): Promise<{ csv: string | null; error: string | null }> {
    // Provera autorizacije - samo ADMIN ili MANAGER mogu exportovati
     const role = await currentRole();
     if (role !== UserRole.ADMIN && role !== UserRole.MANAGER) { // Prilagodite uloge
       return { csv: null, error: "Forbidden" };
     }

    try {
        // Izgradnja Prisma WHERE klauzule na osnovu filtera
        const where: any = {};
        if (filters.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' as const } },
                { description: { contains: filters.search, mode: 'insensitive' as const } },
                // Dodajte druga polja za pretragu
            ];
        }
        // Filtriranje po 'type' umesto 'category'
        if (filters.type) {
            where.type = filters.type; // filters.type je ServiceType enum
        }
         if (filters.isActive !== null && filters.isActive !== undefined) {
             where.isActive = filters.isActive;
         }
        // Dodajte ostale filtere

        // Dohvatanje podataka iz baze (bez paginacije za export)
        const servicesToExport = await db.service.findMany({
            where,
            orderBy: { name: 'asc' }, // Sortiranje
            // Uključite polja za export iz schema.prisma Service modela
            select: {
                id: true,
                name: true,
                type: true, // Polje je 'type'
                description: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                // Polja kao što su vasParameters, unitOfMeasure, parkingZone NISU na Service modelu
                // Ako treba da budu u exportu, moraju biti fetchovana iz povezanih modela (VasService, BulkService, ParkingService)
                // To bi zahtevalo include: { vasServices: true, ... } i ručno mapiranje u stringify pozivu.
            }
        });

        if (servicesToExport.length === 0) {
             // Možete vratiti samo header red, ili prazan string
             const headerRow = ['id', 'name', 'type', 'description', 'isActive', 'createdAt', 'updatedAt'].join(',') + '\n';
             return { csv: headerRow, error: null }; // Vraćamo samo header
             // return { csv: '', error: null }; // Vraćamo prazan string
        }

        // 2. Formatiranje podataka u CSV string
        // Prilagodite opcije stringifiera i nazive kolona prema željenom CSV formatu za export
        const csvString = stringify(servicesToExport, {
            header: true, // Uključuje red headera
            // Eksplicitna definicija kolona i redosleda, mora se poklapati sa 'select' iznad
            columns: [
                'id', 'name', 'type', 'description', 'isActive', 'createdAt', 'updatedAt'
                // Dodajte nazive kolona za polja iz povezanih modela ako ih ručno mapirate
            ],
            // Funkcija transformacije za formatiranje datuma ili drugih kompleksnih tipova
            // transform: (record: any) => ({
            //      ...record,
            //      createdAt: record.createdAt ? record.createdAt.toISOString() : '',
            //      updatedAt: record.updatedAt ? record.updatedAt.toISOString() : '',
            //      isActive: record.isActive ? 'true' : 'false', // Konverzija boolean u string
                 // Mapiranje ServiceType enum vrednosti u željeni string format ako je potrebno
            //      type: record.type ? record.type.toString() : '',
            // })
        });

        // 3. Vraćanje CSV sadržaja
        return { csv: csvString, error: null };

    } catch (error) {
        console.error("Error during service export action:", error);
        return { csv: null, error: "Failed to export services." };
    }
}