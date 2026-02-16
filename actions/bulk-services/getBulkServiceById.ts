// actions/bulk-services/getBulkServiceById.ts
"use server";
import { db } from "@/lib/db";
import { ServerError } from "@/lib/exceptions";
import { getCurrentUser } from "@/lib/session";
import { getCachedData } from "@/lib/cache/memory-cache";

export async function getBulkServiceById(id: string) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      throw new ServerError("Unauthorized");
    }

    const bulkService = await getCachedData(
      `bulk-service:${id}`,
      async () => {
        return await db.bulkService.findUnique({
          where: { id },
          include: {
            provider: true, // ← Vrati sve provider podatke
            service: true,  // ← Vrati sve service podatke
          },
        });
      },
      120 // cache 120 sekundi
    );

    if (!bulkService) {
      throw new ServerError("Bulk service not found");
    }

    return bulkService;
  } catch (error) {
    console.error("[GET_BULK_SERVICE_BY_ID]", error);
    
    if (error instanceof ServerError) {
      throw error;
    }
    throw new ServerError("Failed to fetch bulk service");
  }
}