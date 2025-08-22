// Path: app/api/humanitarian-orgs/[id]/contracts/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth"; // Assuming you have next-auth configured
import { db } from "@/lib/db"; // Assuming you have your Prisma client instance here

// GET - Retrieve all contracts associated with a specific humanitarian organization
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate the user
    const session = await auth();

    // Check if the user is authenticated
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Await params before accessing its properties
    const awaitedParams = await params;
    const organizationId = awaitedParams.id;

    // Provera da li je ID validan pre upita ka bazi
    if (!organizationId) {
         console.error("[HUMANITARIAN_ORG_CONTRACTS_GET] Missing organization ID in params");
         return new NextResponse("Missing organization ID", { status: 400 });
    }


    // Optional: Check if the humanitarian organization exists before fetching contracts
    // This adds an extra database call but can provide a more specific 404 error
    const organization = await db.humanitarianOrg.findUnique({
       where: { id: organizationId },
       select: { id: true } // Only need to select the ID to confirm existence
    });

    if (!organization) {
        console.warn(`[HUMANITARIAN_ORG_CONTRACTS_GET] Humanitarian organization with ID ${organizationId} not found`);
        return new NextResponse("Humanitarian organization not found", { status: 404 });
    }


    // Fetch all contracts linked to this humanitarian organization ID
    const contracts = await db.contract.findMany({
      where: {
        humanitarianOrgId: organizationId, // Filter contracts by the humanitarian organization ID
      },
      include: {
        // Include relations needed by the frontend component (HumanitarianOrgContracts)
        // Na primer, ako prikazujete operatora povezanog sa ugovorom:
        operator: { // Include operator details
           select: {
              id: true,
              name: true,
           }
        },
        // Dodajte druge include ako su potrebni, npr. parkingService, provider, itd.
      },
      // Optional: Add ordering if needed
      orderBy: {
         createdAt: 'desc' // Example: Order by creation date
      }
    });

    // Vraćanje dohvatanih ugovora kao JSON odgovor
    // Komponenta HumanitarianOrgContracts očekuje paginirane podatke ({ items: [], total: number, totalPages: number })
    // Potrebno je dodati paginaciju ovde.
    // Za sada vraćamo sve ugovore, a frontend komponenta će morati da se prilagodi ili se paginacija mora implementirati ovde.

    // --- Implementacija osnovne paginacije ---
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10); // Podrazumevani limit 10

    const skip = (page - 1) * limit;

    const [paginatedContracts, totalContracts] = await db.$transaction([
        db.contract.findMany({
            where: {
                humanitarianOrgId: organizationId,
            },
            include: {
                 operator: {
                    select: {
                       id: true,
                       name: true,
                    }
                 },
            },
            orderBy: {
                createdAt: 'desc',
            },
            skip: skip,
            take: limit,
        }),
        db.contract.count({
            where: {
                humanitarianOrgId: organizationId,
            },
        }),
    ]);

    const totalPages = Math.ceil(totalContracts / limit);

    return NextResponse.json({
        items: paginatedContracts,
        total: totalContracts,
        totalPages: totalPages,
        currentPage: page,
        limit: limit,
    });

  } catch (error) {
    console.error("[HUMANITARIAN_ORG_CONTRACTS_GET]", error);
    // Return a generic internal server error response
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// You can add other HTTP methods (POST, PUT, DELETE) here if needed for contracts related to a humanitarian organization
// export async function POST(...) { ... }
