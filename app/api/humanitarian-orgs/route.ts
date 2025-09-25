// /app/api/humanitarian-orgs/route.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { HumanitarianOrgWithDetails, HumanitarianOrgFilterOptions, HumanitarianOrgsApiResponse } from '@/lib/types/humanitarian-org-types';
import { createHumanitarianOrg } from '@/actions/humanitarian-orgs/create';

// Uvozimo funkcije za proveru autentifikacije i uloge
import { auth } from '@/auth'; // Za dobijanje sesije
import { currentRole } from "@/lib/auth"; // Za dobijanje uloge
import { UserRole } from "@prisma/client"; // Uvozimo enum za uloge


// Handler za GET za dohvatanje liste humanitarnih organizacija
export async function GET(request: NextRequest): Promise<NextResponse<HumanitarianOrgsApiResponse | { error: string }>> {
    // Provera da li je korisnik ulogovan
     const session = await auth();
     if (!session?.user) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
     }

    try {
        const { searchParams } = request.nextUrl;

        const search = searchParams.get('search');
        const isActiveParam = searchParams.get('isActive');

        let isActive: boolean | null = null;
        if (isActiveParam === 'true') {
            isActive = true;
        } else if (isActiveParam === 'false') {
            isActive = false;
        }

         const limit = searchParams.get('limit');
         const offset = searchParams.get('offset');
         const take = limit ? parseInt(limit, 10) : undefined;
         const skip = offset ? parseInt(offset, 10) : undefined;


        const where: any = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' as const } },
                { contactPerson: { contains: search, mode: 'insensitive' as const } },
                { email: { contains: search, mode: 'insensitive' as const } },
                { phone: { contains: search, mode: 'insensitive' as const } },
                { address: { contains: search, mode: 'insensitive' as const } },
                 { mission: { contains: search, mode: 'insensitive' as const } },
            ];
        }

        if (isActive !== null) {
            where.isActive = isActive;
        }

        const organizations = await db.humanitarianOrg.findMany({
            where,
            take,
            skip,
            orderBy: { name: 'asc' },
            include: {
                 _count: {
                      select: {
                          contracts: true,
                          // Ispravljeno na humanitarianRenewals za konzistentnost sa HumanitarianOrgDetails komponentom
                          humanitarianRenewals: true
                      }
                 }
            }
        });

        const totalCount = await db.humanitarianOrg.count({ where });


        const apiResponse: HumanitarianOrgsApiResponse = {
            humanitarianOrgs: organizations as HumanitarianOrgWithDetails[],
            totalCount: totalCount,
        };
        return NextResponse.json(apiResponse, { status: 200 });

    } catch (error) {
        console.error("Error fetching humanitarian organizations:", error);
        return NextResponse.json({ error: "Failed to fetch humanitarian organizations." }, { status: 500 });
    }
}


// Handler za POST za kreiranje nove humanitarne organizacije
export async function POST(request: NextRequest) {
     // Provera uloge korisnika - samo ADMIN ili MANAGER mogu kreirati
     const role = await currentRole();
     if (role !== UserRole.ADMIN && role !== UserRole.MANAGER) {
       return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
     }

    try {
        const values = await request.json();

        const result = await createHumanitarianOrg(values);

        if (result.error) {
            if (result.details) {
                 return NextResponse.json({ error: result.error, details: result.details }, { status: 400 });
            }
             if (result.error.includes("already exists")) {
                  return NextResponse.json({ error: result.error }, { status: 409 });
             }
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: result.success, id: result.id }, { status: 201 });

    } catch (error) {
        console.error("Error creating humanitarian organization via API:", error);
        return NextResponse.json({ error: "Failed to create humanitarian organization." }, { status: 500 });
    }
}