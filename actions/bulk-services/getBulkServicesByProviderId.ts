// actions/bulk-services/getBulkServicesByProviderId.ts
"use server";
import { db } from "@/lib/db";
import { ServerError } from "@/lib/exceptions";
import { getCurrentUser } from "@/lib/session";
import { cacheTag } from "next/cache";

async function fetchBulkServicesByProviderId(providerId: string) {
  "use cache";
  cacheTag("bulk-services", `bulk-services-provider:${providerId}`);

  return db.bulkService.findMany({
    where: { providerId },
    include: {
      service: {
        select: {
          id: true,
          name: true,
          type: true,
          isActive: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getBulkServicesByProviderId(providerId: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new ServerError("Unauthorized");

    return await fetchBulkServicesByProviderId(providerId);
  } catch (error) {
    console.error("[GET_BULK_SERVICES_BY_PROVIDER]", error);
    if (error instanceof ServerError) throw error;
    throw new ServerError("Failed to fetch provider bulk services");
  }
}