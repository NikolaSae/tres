// Path: actions/operators/getContractsByOperatorId.ts
'use server';

import { db } from '@/lib/db';
import { auth } from '@/auth';
import { UserRole } from "@prisma/client";
import { currentRole } from '@/lib/auth'; // Pretpostavljena putanja do currentRole funkcije
import { Contract } from '@prisma/client'; // Uvezite Contract tip

/**
 * Dohvata listu ugovora povezanih sa određenim operaterom.
 * @param operatorId ID operatera.
 * @returns Niz ugovora ili prazan niz u slučaju greške/nedostatka dozvola.
 */
export async function getContractsByOperatorId(operatorId: string): Promise<Contract[]> {
    // Provera autentifikacije
    const session = await auth();
    if (!session?.user) {
        console.error("[getContractsByOperatorId] Unauthorized access attempt.");
        // Vratite prazan niz umesto greške za bolji UX na klijentu
        return [];
    }

    // Opciona provera autorizacije (koje uloge mogu da vide ugovore operatera?)
    // const role = await currentRole();
    // if (role !== UserRole.ADMIN && role !== UserRole.MANAGER) { // Prilagodite uloge
    //     console.error(`[getContractsByOperatorId] Forbidden access attempt by role: ${role}`);
    //     return [];
    // }

    if (!operatorId) {
        console.warn("[getContractsByOperatorId] No operatorId provided.");
        return [];
    }

    try {
        // Dohvatite ugovore gde je operatorId jednak prosleđenom ID-u
        const contracts = await db.contract.findMany({
            where: {
                operatorId: operatorId,
            },
            // Možda želite da uključite i druge relacije ako su potrebne na UI
            // include: {
            //     provider: true,
            //     humanitarianOrg: true,
            //     parkingService: true,
            //     services: true,
            // }
            orderBy: {
                endDate: 'desc', // Sortirajte po datumu završetka, najnoviji prvi
            }
        });

        console.log(`[getContractsByOperatorId] Found ${contracts.length} contracts for operator ${operatorId}`);

        return contracts; // Vratite listu ugovora

    } catch (error) {
        console.error("[getContractsByOperatorId] Error fetching contracts:", error);
        // U slučaju greške, vratite prazan niz
        return [];
    }
}
