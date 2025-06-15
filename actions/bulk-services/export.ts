//actions/bulk-services/export.ts

"use server";

import { db } from "@/lib/db";
import { ServerError } from "@/lib/exceptions";
import { getCurrentUser } from "@/lib/session";
import { formatBulkServiceCSV } from "@/lib/bulk-services/csv-processor"; // Ispravno ime exportovane funkcije
import { BulkServicesFilter } from "@/lib/types/bulk-service-types";

export async function exportBulkServices(filters?: BulkServicesFilter) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      throw new Error("Unauthorized");
    }

    // Build where conditions based on filters
    const where: any = {};
    
    if (filters?.providerId) {
      where.providerId = filters.providerId;
    }
    
    if (filters?.serviceId) {
      where.serviceId = filters.serviceId;
    }
    
    if (filters?.providerName) {
      where.provider_name = {
        contains: filters.providerName,
        mode: "insensitive"
      };
    }
    
    if (filters?.serviceName) {
      where.service_name = {
        contains: filters.serviceName,
        mode: "insensitive"
      };
    }

    // Fetch bulk services from database
    const bulkServices = await db.bulkService.findMany({
      where,
      include: {
        provider: {
          select: {
            name: true,
          },
        },
        service: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Generate CSV content
    const csvContent = formatBulkServiceCSV(bulkServices);

    return {
      success: true,
      csvContent,
      recordCount: bulkServices.length,
    };
  } catch (error) {
    console.error("[EXPORT_BULK_SERVICES]", error);
    throw new ServerError("Failed to export bulk services");
  }
}