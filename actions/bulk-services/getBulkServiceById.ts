//actions/bulk-services/getBulkServiceById.ts

"use server";

import { db } from "@/lib/db";
import { ServerError } from "@/lib/exceptions";
import { getCurrentUser } from "@/lib/session";

export async function getBulkServiceById(id: string) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      throw new Error("Unauthorized");
    }

    const bulkService = await db.bulkService.findUnique({
      where: { id },
      include: {
        provider: true,
        service: true,
      },
    });

    if (!bulkService) {
      throw new Error("Bulk service not found");
    }

    return bulkService;
  } catch (error) {
    console.error("[GET_BULK_SERVICE_BY_ID]", error);
    throw new ServerError("Failed to fetch bulk service");
  }
}