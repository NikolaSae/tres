//app/api/providers/[id]/contracts/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// GET - Retrieve all contracts associated with a specific provider
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

    const { id: providerId } = await params;

    // Optional: Check if the provider exists before fetching contracts
    const provider = await db.provider.findUnique({
       where: { id: providerId },
       select: { id: true }
    });

    if (!provider) {
        return new NextResponse("Provider not found", { status: 404 });
    }

    // Fetch all contracts linked to this provider ID
    const contracts = await db.contract.findMany({
      where: {
        providerId: providerId,
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
         createdAt: 'desc'
      }
    });

    return NextResponse.json(contracts);

  } catch (error) {
    console.error("[PROVIDER_CONTRACTS_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}