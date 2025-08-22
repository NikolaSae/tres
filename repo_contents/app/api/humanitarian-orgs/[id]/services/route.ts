// Path: app/api/humanitarian-orgs/[id]/services/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ServiceType } from "@prisma/client";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Pravilno koristimo params.id
    const orgId = params.id;

    if (!orgId) {
      return new NextResponse("Humanitarian organization ID is required", { status: 400 });
    }

    // Proveravamo da li organizacija postoji
    const organization = await db.humanitarianOrg.findUnique({
      where: { id: orgId }
    });

    if (!organization) {
      return new NextResponse("Humanitarian organization not found", { status: 404 });
    }

    // Tražimo servise povezane sa humanitarnom organizacijom kroz ugovore
    const contracts = await db.contract.findMany({
      where: {
        humanitarianOrgId: orgId,
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
        // Filtriramo samo humanitarne servise
        if (serviceContract.service.type === ServiceType.HUMANITARIAN) {
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
    console.error("[HUMANITARIAN_SERVICES]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}