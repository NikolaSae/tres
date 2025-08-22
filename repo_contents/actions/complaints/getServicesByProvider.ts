// Path: /actions/complaints/getServicesByProvider.ts
'use server';

import { db } from '@/lib/db';
import { auth } from '@/auth';
import { UserRole } from "@prisma/client";
import { currentRole } from '@/lib/auth'; // Pretpostavljena putanja do currentRole funkcije

// Definirajte tip za servis koji vraćamo
interface ServiceOption {
    id: string;
    name: string;
    type: string; // Dodajte i tip servisa ako je relevantno
}

export async function getServicesByProvider(providerId: string): Promise<{ data: ServiceOption[], error: string | null }> {
    // Provera autentifikacije i autorizacije
    const session = await auth();
    if (!session?.user) {
        return { data: [], error: "Unauthorized" };
    }

    const role = await currentRole();
    // Prilagodite uloge koje imaju pravo da vide servise povezane sa provajderima
    if (role !== UserRole.ADMIN && role !== UserRole.MANAGER && role !== UserRole.AGENT && role !== UserRole.USER) {
        return { data: [], error: "Forbidden" };
    }

    if (!providerId) {
        // Vratite praznu listu ako nema providerId, nije greška
        return { data: [], error: null };
    }

    try {
        // Dohvati servise povezane sa ovim provajderom.
        // Servisi mogu biti povezani na više načina:
        // 1. Direktno preko VasService modela
        // 2. Direktno preko BulkService modela
        // 3. Indirektno preko ServiceContract -> Contract modela (ako je ServiceContract povezan sa Contract, a Contract sa Provider)

        // Pronađite ServiceContract unose koji su povezani sa ugovorima ovog provajdera
        const servicesViaContracts = await db.serviceContract.findMany({
            where: {
                contract: {
                    providerId: providerId,
                },
            },
            select: {
                serviceId: true,
                service: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                    },
                },
            },
        });

        // Pronađite VasService unose za ovog provajdera i dohvatite povezane servise
        const servicesViaVas = await db.vasService.findMany({
             where: {
                 provajderId: providerId, // Proverite da li je ime polja provajderId
             },
             select: {
                 serviceId: true,
                 service: {
                     select: {
                         id: true,
                         name: true,
                         type: true,
                     },
                 },
             },
             distinct: ['serviceId'], // Osigurajte jedinstvene servise
        });

         // Pronađite BulkService unose za ovog provajdera i dohvatite povezane servise
         const servicesViaBulk = await db.bulkService.findMany({
             where: {
                 providerId: providerId, // Proverite da li je ime polja providerId
             },
             select: {
                 serviceId: true,
                 service: {
                     select: {
                         id: true,
                         name: true,
                         type: true,
                     },
                 },
             },
             distinct: ['serviceId'], // Osigurajte jedinstvene servise
         });


        // Kombinujte sve liste servisa
        const allRelatedServices = [
            ...servicesViaContracts.map(sc => sc.service),
            ...servicesViaVas.map(vs => vs.service),
            ...servicesViaBulk.map(bs => bs.service),
        ].filter(service => service !== null); // Filtrirajte null vrednosti ako postoje

        // Uklonite duplikate po ID-u
        const uniqueServicesMap = new Map<string, ServiceOption>();
        allRelatedServices.forEach(service => {
            if (service) { // Provera za null/undefined
                 uniqueServicesMap.set(service.id, {
                     id: service.id,
                     name: service.name,
                     type: service.type,
                 });
            }
        });

        const uniqueServices = Array.from(uniqueServicesMap.values());

        console.log(`[getServicesByProvider] Found ${uniqueServices.length} services for provider ${providerId}`);

        return { data: uniqueServices, error: null };

    } catch (error) {
        console.error("[getServicesByProvider] Error fetching services:", error);
        return { data: [], error: "Failed to fetch services for the selected provider." };
    }
}