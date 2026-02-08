// Path: app/api/humanitarian-orgs/[id]/contracts/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// GET - Retrieve all contracts associated with a specific humanitarian organization
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate the user
    const session = await auth();

    // Check if the user is authenticated
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Await params before accessing its properties
    const { id: organizationId } = await params;

    // Provera da li je ID validan pre upita ka bazi
    if (!organizationId) {
         console.error("[HUMANITARIAN_ORG_CONTRACTS_GET] Missing organization ID in params");
         return new NextResponse("Missing organization ID", { status: 400 });
    }

    // Optional: Check if the humanitarian organization exists before fetching contracts
    const organization = await db.humanitarianOrg.findUnique({
       where: { id: organizationId },
       select: { id: true }
    });

    if (!organization) {
        console.warn(`[HUMANITARIAN_ORG_CONTRACTS_GET] Humanitarian organization with ID ${organizationId} not found`);
        return new NextResponse("Humanitarian organization not found", { status: 404 });
    }

    // --- Implementacija osnovne paginacije ---
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);

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
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}