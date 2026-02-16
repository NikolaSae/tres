// actions/bulk-services/getBulkServicesByProviderId.ts
"use server";
import { db } from "@/lib/db";
import { ServerError } from "@/lib/exceptions";
import { getCurrentUser } from "@/lib/session";
import { getCachedData } from "@/lib/cache/memory-cache";

export async function getBulkServicesByProviderId(providerId: string) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      throw new ServerError("Unauthorized");
    }

    const bulkServices = await getCachedData(
      `bulk-services-provider:${providerId}`,
      async () => {
        return await db.bulkService.findMany({
          where: { providerId },
          include: {
            service: {
              select: {
                id: true,
                name: true,
                type: true,
                isActive: true,
              }
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });
      },
      300 // cache 60 sekundi
    );

    return bulkServices;
  } catch (error) {
    console.error("[GET_BULK_SERVICES_BY_PROVIDER]", error);
    
    if (error instanceof ServerError) {
      throw error;
    }
    throw new ServerError("Failed to fetch provider bulk services");
  }
}