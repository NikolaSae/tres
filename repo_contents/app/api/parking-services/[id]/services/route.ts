// Path: app/api/parking-services/[id]/services/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ServiceType } from "@prisma/client";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Pravilno koristimo params.id
    const parkingId = params.id;

    if (!parkingId) {
      return new NextResponse("Parking service ID is required", { status: 400 });
    }

    // Proveravamo da li parking servis postoji
    const parkingService = await db.parkingService.findUnique({
      where: { id: parkingId }
    });

    if (!parkingService) {
      return new NextResponse("Parking service not found", { status: 404 });
    }

    // Tražimo servise povezane sa parking servisom kroz ugovore
    const contracts = await db.contract.findMany({
      where: {
        parkingServiceId: parkingId,
        status: "ACTIVE" // Uzimamo samo aktivne ugovore
      },
      include: {
        services: {
          include: {
            service: true
          }
        }
      }
    });

    // Izvlačimo servise iz ugovora i eliminišemo duplikate
    const servicesMap = new Map();
    
    contracts.forEach(contract => {
      contract.services.forEach(serviceContract => {
        // Filtriramo samo parking servise
        if (serviceContract.service.type === ServiceType.PARKING) {
          servicesMap.set(serviceContract.serviceId, {
            id: serviceContract.serviceId,
            name: serviceContract.service.name,
            description: serviceContract.service.description,
            specificTerms: serviceContract.specificTerms,
            contractId: contract.id,
            // Dodajemo ostale potrebne informacije
            type: serviceContract.service.type,
            isActive: serviceContract.service.isActive
          });
        }
      });
    });

    // Konvertujemo Map u niz
    const services = Array.from(servicesMap.values());

    return NextResponse.json(services);
  } catch (error) {
    console.error("[PARKING_OPTIONS]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}