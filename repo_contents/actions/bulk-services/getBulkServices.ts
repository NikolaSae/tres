//actions/bulk-services/getBulkServices.ts

"use server";

import { db } from "@/lib/db";
import { ServerError } from "@/lib/exceptions";
import { BulkServicesFilter } from "@/lib/types/bulk-service-types";
import { getCurrentUser } from "@/lib/session";

export async function getBulkServices({
  providerId,
  serviceId,
  providerName,
  serviceName,
  page = 1,
  limit = 10,
  sortBy = "createdAt",
  sortOrder = "desc",
}: BulkServicesFilter) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      throw new Error("Unauthorized");
    }

    const skip = (page - 1) * limit;
    
    // Build where conditions based on filters
    const where: any = {};
    
    if (providerId) {
      where.providerId = providerId;
    }
    
    if (serviceId) {
      where.serviceId = serviceId;
    }
    
    if (providerName) {
      where.provider_name = {
        contains: providerName,
        mode: "insensitive"
      };
    }
    
    if (serviceName) {
      where.service_name = {
        contains: serviceName,
        mode: "insensitive"
      };
    }

    // Get total count for pagination
    const totalCount = await db.bulkService.count({ where });

    // Get data with pagination, sorting, and includes
    const bulkServices = await db.bulkService.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        provider: true,
        service: true,
      },
    });

    return {
      data: bulkServices,
      meta: {
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  } catch (error) {
    console.error("[GET_BULK_SERVICES]", error);
    throw new ServerError("Failed to fetch bulk services");
  }
}