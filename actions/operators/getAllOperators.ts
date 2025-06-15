// Path: actions/operators/getAllOperators.ts
'use server';

import { db } from '@/lib/db';
import { auth } from '@/auth';
import { UserRole, Operator } from "@prisma/client";
import { currentRole } from '@/lib/auth'; // Pretpostavljena putanja do currentRole funkcije

/**
 * Dohvata listu svih aktivnih operatora za upotrebu u dropdown menijima.
 * @returns Niz operatora (ID i name) ili prazan niz u slučaju greške/nedostatka dozvola.
 */
export async function getAllOperators(): Promise<Pick<Operator, 'id' | 'name'>[]> {
    // Provera autentifikacije
    const session = await auth();
    if (!session?.user) {
        console.error("[getAllOperators] Unauthorized access attempt.");
        return [];
    }

    // Opciona provera autorizacije (koje uloge mogu da vide listu operatora?)
    // Pretpostavljamo da svi ulogovani korisnici mogu videti operatere za potrebe ugovora.
    // const role = await currentRole();
    // if (role !== UserRole.ADMIN && role !== UserRole.MANAGER && role !== UserRole.AGENT && role !== UserRole.USER) {
    //     console.error(`[getAllOperators] Forbidden access attempt by role: ${role}`);
    //     return [];
    // }

    try {
        // Dohvatite sve aktivne operatore, birajući samo ID i name
        const operators = await db.operator.findMany({
            where: {
                active: true, // Obično želite samo aktivne operatere u dropdownu
            },
            select: {
                id: true,
                name: true,
            },
            orderBy: {
                name: 'asc', // Sortirajte po imenu
            }
        });

        console.log(`[getAllOperators] Found ${operators.length} active operators.`);

        return operators; // Vratite listu operatora

    } catch (error) {
        console.error("[getAllOperators] Error fetching operators:", error);
        // U slučaju greške, vratite prazan niz
        return [];
    }
}
