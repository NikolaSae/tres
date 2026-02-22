// Path: app/api/parking-services/[id]/services/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ServiceType } from "@prisma/client";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Dodana auth provera — nedostajala
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: parkingId } = await params;

    if (!parkingId) {
      return new NextResponse("Parking service ID is required", { status: 400 });
    }

    const parkingService = await db.parkingService.findUnique({
      where: { id: parkingId },
    });

    if (!parkingService) {
      return new NextResponse("Parking service not found", { status: 404 });
    }

    const contracts = await db.contract.findMany({
      where: { parkingServiceId: parkingId, status: "ACTIVE" },
      include: {
        services: {
          include: { service: true },
        },
      },
    });

    const servicesMap = new Map<string, {
      id: string;
      name: string;
      description: string | null;
      specificTerms: string | null;
      contractId: string;
      type: ServiceType;
      isActive: boolean;
    }>();

    contracts.forEach((contract) => {
      contract.services.forEach((serviceContract) => {
        if (serviceContract.service.type === ServiceType.PARKING) {
          servicesMap.set(serviceContract.serviceId, {
            id: serviceContract.serviceId,
            name: serviceContract.service.name,
            description: serviceContract.service.description,
            specificTerms: serviceContract.specificTerms,
            contractId: contract.id,
            type: serviceContract.service.type,
            isActive: serviceContract.service.isActive,
          });
        }
      });
    });

    return NextResponse.json(Array.from(servicesMap.values()));
  } catch (error) {
    console.error("[PARKING_OPTIONS]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}