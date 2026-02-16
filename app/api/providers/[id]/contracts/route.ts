// app/api/providers/[id]/contracts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from 'next/cache';
import { auth } from "@/auth";
import { db } from "@/lib/db";

// ✅ Cached funkcija za provider contracts
const getCachedProviderContracts = unstable_cache(
  async (providerId: string) => {
    console.log(`🔍 Fetching contracts for provider: ${providerId}`);
    
    return db.contract.findMany({
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
        createdBy: {
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
  },
  ['provider-contracts'],
  { revalidate: 120 } // 2 minuta cache
);

// GET - Retrieve all contracts associated with a specific provider
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Authenticate the user
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: providerId } = await params;

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    // ✅ Check if the provider exists
    const provider = await db.provider.findUnique({
      where: { id: providerId },
      select: { id: true, name: true }
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    // ✅ Fetch cached contracts
    const contracts = await getCachedProviderContracts(providerId);

    return NextResponse.json({
      success: true,
      contracts,
      total: contracts.length,
      provider: {
        id: provider.id,
        name: provider.name,
      }
    });

  } catch (error) {
    console.error("[PROVIDER_CONTRACTS_GET_ERROR]", error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}