//actions/providers/getServicesForNewContracts.ts

"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Service, ServiceType } from "@prisma/client";

interface ServiceForContract {
  id: string;
  name: string;
  type: ServiceType;
  description: string | null;
}

interface GetServicesForNewContractsResult {
  success: boolean;
  data?: ServiceForContract[];
  error?: string;
}

export async function getServicesForNewContracts(
  providerId: string,
  includeAllServices: boolean = false // NOVI PARAMETAR: podrazumevano false
): Promise<GetServicesForNewContractsResult> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    if (!providerId) {
      return { success: false, error: "Provider ID is required." };
    }

    let serviceIdsToExclude: Set<string> = new Set();

    // Ako ne želimo sve servise, dohvatamo ID-eve povezanih servisa koje treba isključiti
    if (!includeAllServices) {
      const linkedServiceContracts = await db.serviceContract.findMany({
        where: {
          contract: {
            providerId: providerId, // Filtriraj po ugovorima koji pripadaju ovom provajderu
          },
        },
        select: {
          serviceId: true,
        },
      });
      linkedServiceContracts.forEach(sc => serviceIdsToExclude.add(sc.serviceId));
    }

    // Dohvati sve VASService entitete povezane sa provajderom
    const vasServices = await db.vasService.findMany({
      where: {
        provajderId: providerId,
        service: {
          id: {
            // Primeni notIn filter samo ako ne želimo sve servise
            ...(includeAllServices ? {} : { notIn: Array.from(serviceIdsToExclude) }),
          },
        },
      },
      select: {
        serviceId: true,
      },
    });

    // Dohvati sve BulkService entitete povezane sa provajderom
    const bulkServices = await db.bulkService.findMany({
      where: {
        providerId: providerId,
        service: {
          id: {
            // Primeni notIn filter samo ako ne želimo sve servise
            ...(includeAllServices ? {} : { notIn: Array.from(serviceIdsToExclude) }),
          },
        },
      },
      select: {
        serviceId: true,
      },
    });

    // Kombinuj sve preostale jedinstvene serviceId-eve
    const allServiceIds = new Set<string>();
    vasServices.forEach(vs => allServiceIds.add(vs.serviceId));
    bulkServices.forEach(bs => allServiceIds.add(bs.serviceId));

    // Dohvati detalje svih jedinstvenih servisa
    const services: ServiceForContract[] = await db.service.findMany({
      where: {
        id: {
          in: Array.from(allServiceIds),
        },
      },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return { success: true, data: services };

  } catch (error) {
    console.error("[GET_SERVICES_FOR_NEW_CONTRACTS_ERROR]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch services for new contracts.",
    };
  }
}
