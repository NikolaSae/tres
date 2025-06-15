// /actions/humanitarian-orgs/get.ts
'use server';

import { db } from '@/lib/db';
import { HumanitarianOrgWithDetails, HumanitarianOrgFilterOptions } from '@/lib/types/humanitarian-org-types';
import { auth } from '@/auth';
import { UserRole } from "@prisma/client";
import { currentRole } from '@/lib/auth'; // Pretpostavljena putanja do currentRole funkcije

interface GetOrgsParams extends HumanitarianOrgFilterOptions {
    page?: number;
    limit?: number;
}

export async function getHumanitarianOrgs(params: GetOrgsParams) {
    // U realnoj aplikaciji, dodali biste proveru autentifikacije/autorizacije
    const session = await auth();
    if (!session?.user) {
       // Vratite grešku ili preusmerite
        return { data: [], total: 0, error: "Unauthorized" };
     }

    // Provera uloge ako je potrebna za dohvatanje liste
     const role = await currentRole(); // Ako koristite currentRole()
     if (role !== UserRole.ADMIN && role !== UserRole.MANAGER && role !== UserRole.USER) { // Prilagodite uloge
        return { data: [], total: 0, error: "Forbidden" };
     }

    try {
        const { search, isActive, page = 1, limit = 10 } = params; // Parsiranje parametara, podesite limit na 10 ili 20 za paginaciju

        // Izgradnja Prisma WHERE klauzule
        const where: any = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' as const } },
                { contactPerson: { contains: search, mode: 'insensitive' as const } },
                 // Dodajte ostala polja za pretragu
            ];
        }
        if (isActive !== null && isActive !== undefined) {
            where.isActive = isActive;
        }
        // Dodajte ostale filtere iz params u where klauzulu

        const skip = (page - 1) * limit;

        // Dohvatanje podataka i ukupnog broja
        const [organizations, totalCount] = await Promise.all([
            db.humanitarianOrg.findMany({
                where,
                take: limit,
                skip: skip,
                orderBy: { name: 'asc' }, // Sortiranje
                 include: {
                     _count: {
                         select: {
                             contracts: true,
                            // complaints: true, // Proverite tačno ime relacije
                            // renewals: true // Proverite tačno ime relacije (humanitarianRenewals vs renewals)
                         }
                     }
                 }
            }),
            db.humanitarianOrg.count({ where }),
        ]);

        // Vraćanje podataka i ukupnog broja
        return { data: organizations as HumanitarianOrgWithDetails[], total: totalCount, error: null };

    } catch (error) {
        console.error("Error fetching humanitarian organizations in action:", error);
        return { data: [], total: 0, error: "Failed to fetch humanitarian organizations." };
    }
}