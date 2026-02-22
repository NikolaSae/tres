// actions/bulk-services/getBulkServiceById.ts
"use server";
import { db } from "@/lib/db";
import { ServerError } from "@/lib/exceptions";
import { getCurrentUser } from "@/lib/session";
import { cacheTag } from "next/dist/server/use-cache/cache-tag";

async function fetchBulkServiceById(id: string) {
  "use cache";
  cacheTag("bulk-services", `bulk-service:${id}`);

  return db.bulkService.findUnique({
    where: { id },
    include: {
      provider: true,
      service: true,
    },
  });
}

export async function getBulkServiceById(id: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new ServerError("Unauthorized");

    const bulkService = await fetchBulkServiceById(id);
    if (!bulkService) throw new ServerError("Bulk service not found");

    return bulkService;
  } catch (error) {
    console.error("[GET_BULK_SERVICE_BY_ID]", error);
    if (error instanceof ServerError) throw error;
    throw new ServerError("Failed to fetch bulk service");
  }
}