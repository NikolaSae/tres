// /app/api/humanitarian-orgs/[id]/route.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { HumanitarianOrgWithDetails } from '@/lib/types/humanitarian-org-types';
import { updateHumanitarianOrg } from '@/actions/humanitarian-orgs/update';
import { deleteHumanitarianOrg } from '@/actions/humanitarian-orgs/delete';

// Uvozimo funkcije za proveru autentifikacije i uloge
import { auth } from '@/auth'; // Za dobijanje sesije
import { currentRole } from "@/lib/auth"; // Za dobijanje uloge
import { UserRole } from "@prisma/client"; // Uvozimo enum za uloge


// Handler za GET za dohvatanje pojedinačne humanitarne organizacije po ID-u
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
): Promise<NextResponse<HumanitarianOrgWithDetails | { error: string }>> {
    // Provera da li je korisnik ulogovan
     const session = await auth();
     if (!session?.user) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
     }

    const { id } = params;

    try {
        const organization = await db.humanitarianOrg.findUnique({
            where: { id },
             include: {
                  contracts: {
                     select: {
                         id: true,
                         name: true,
                         contractNumber: true,
                         status: true,
                         startDate: true,
                         endDate: true,
                         type: true,
                         revenuePercentage: true,
                         humanitarianRenewals: {
                              select: {
                                  id: true,
                                  subStatus: true,
                                  renewalStartDate: true,
                                  proposedStartDate: true,
                                  createdAt: true,
                              },
                              orderBy: { createdAt: 'desc' },
                              take: 1,
                         },
                     },
                     orderBy: { endDate: 'desc' },
                 },
                 complaints: {
                      select: { id: true, title: true, status: true, createdAt: true },
                 },
                 humanitarianRenewals: true,
                 _count: {
                      select: { contracts: true, complaints: true, humanitarianRenewals: true }
                 }
            }
        });

        if (!organization) {
            return NextResponse.json({ error: "Humanitarian organization not found." }, { status: 404 });
        }

        return NextResponse.json(organization as HumanitarianOrgWithDetails, { status: 200 });

    } catch (error) {
        console.error(`Error fetching humanitarian organization with ID ${id}:`, error);
        return NextResponse.json({ error: "Failed to fetch humanitarian organization." }, { status: 500 });
    }
}

// Handler za PUT za ažuriranje humanitarne organizacije po ID-u
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
     // Provera uloge korisnika - samo ADMIN ili MANAGER mogu ažurirati
     const role = await currentRole();
     if (role !== UserRole.ADMIN && role !== UserRole.MANAGER) {
       return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
     }

    const { id } = params;

    try {
        const values = await request.json();

        const result = await updateHumanitarianOrg(id, values);

        if (result.error) {
             if (result.error === "Humanitarian organization not found.") {
                return NextResponse.json({ error: result.error }, { status: 404 });
             }
             if (result.details) {
                 return NextResponse.json({ error: result.error, details: result.details }, { status: 400 });
             }
             if (result.error.includes("already exists")) {
                  return NextResponse.json({ error: result.error }, { status: 409 });
             }
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: result.success, id: result.id }, { status: 200 });

    } catch (error) {
        console.error(`Error updating humanitarian organization with ID ${id} via API:`, error);
        return NextResponse.json({ error: "Failed to update humanitarian organization." }, { status: 500 });
    }
}


// Handler za DELETE za brisanje humanitarne organizacije po ID-u
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
     // Provera uloge korisnika - samo ADMIN može brisati
     const role = await currentRole();
     // Možda samo ADMIN može brisati, a MANAGER samo ažurirati? Podesite prema potrebi.
     if (role !== UserRole.ADMIN) {
       return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
     }


    const { id } = params;

    try {
        const result = await deleteHumanitarianOrg(id);

        if (result.error) {
             if (result.error === "Humanitarian organization not found.") {
                return NextResponse.json({ error: result.error }, { status: 404 });
             }
             if (result.error.includes("Cannot delete humanitarian organization because it is associated")) {
                return NextResponse.json({ error: result.error }, { status: 409 });
             }
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: result.success }, { status: 200 });

    } catch (error) {
        console.error(`Error deleting humanitarian organization with ID ${id} via API:`, error);
        return NextResponse.json({ error: "Failed to delete humanitarian organization." }, { status: 500 });
    }
}