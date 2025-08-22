// Path: app/api/providers/[id]/bulk-services/route.ts

// Path: app/api/providers/[id]/bulk-services/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ServiceType } from "@prisma/client";

export async function GET(
  req: Request,
  { params: { id } }: { params: { id: string } } // IZMENA: Destrukturirano 'id' direktno iz params
) {
  try {
    const providerId = id; // Koristimo destrukturirani 'id'

    if (!providerId) {
      return new NextResponse("Provider ID is required", { status: 400 });
    }

    // Verify that the provider exists
    const provider = await db.provider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      return new NextResponse("Provider not found", { status: 404 });
    }

    // Dohvati servise tipa 'BULK' koji su povezani sa ovim provajderom
    // preko relacije ka BulkService modelu.
    const services = await db.service.findMany({
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
      },
      orderBy: {
        name: "asc",
      },
    });

    console.log(`Found ${services.length} bulk services for provider ${providerId}`);

    return NextResponse.json(services);
  } catch (error) {
    console.error("[BULK_SERVICES]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}