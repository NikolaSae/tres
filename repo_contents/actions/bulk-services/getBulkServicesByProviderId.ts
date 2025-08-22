//actions/bulk-services/getBulkServicesByProviderId.ts

"use server";

import { db } from "@/lib/db";
import { ServerError } from "@/lib/exceptions";
import { getCurrentUser } from "@/lib/session";

export async function getBulkServicesByProviderId(providerId: string) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      throw new Error("Unauthorized");
    }

    const bulkServices = await db.bulkService.findMany({
      where: { providerId: providerId },
      include: {
        service: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return bulkServices;
  } catch (error) {
    console.error("[GET_BULK_SERVICES_BY_PROVIDER]", error);
    throw new ServerError("Failed to fetch provider bulk services");
  }
}