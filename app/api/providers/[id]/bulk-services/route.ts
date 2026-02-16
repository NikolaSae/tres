// app/api/providers/[id]/bulk-services/route.ts
import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from 'next/cache';
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ServiceType } from "@prisma/client";

// ✅ Cached funkcija za bulk services
const getCachedBulkServices = unstable_cache(
  async (providerId: string) => {
    console.log(`🔍 Fetching bulk services for provider: ${providerId}`);
    
    return db.service.findMany({
      where: {
        type: ServiceType.BULK,
        bulkServices: {
          some: {
            providerId: providerId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  },
  ['provider-bulk-services'],
  { revalidate: 120 }
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Auth check
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

    // Verify that the provider exists
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

    // ✅ Koristi cached funkciju
    const services = await getCachedBulkServices(providerId);

    console.log(`Found ${services.length} bulk services for provider ${providerId}`);

    return NextResponse.json({
      success: true,
      services,
      total: services.length,
      provider: {
        id: provider.id,
        name: provider.name,
      }
    });

  } catch (error) {
    console.error("[BULK_SERVICES_ERROR]", error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}