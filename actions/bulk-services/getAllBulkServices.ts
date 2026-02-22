// actions/bulk-services/getAllBulkServices.ts
"use server";
import { db } from "@/lib/db";
import { cacheTag } from "next/dist/server/use-cache/cache-tag";
import { BulkService } from "@prisma/client";

type BulkServiceWithRelations = BulkService & {
  provider: { name: string };
  service: { name: string };
};

async function fetchAllBulkServices(): Promise<BulkServiceWithRelations[]> {
  "use cache";
  cacheTag("bulk-services");

  return db.bulkService.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      provider: { select: { name: true } },
      service: { select: { name: true } },
    },
  });
}

export async function getAllBulkServices(): Promise<BulkServiceWithRelations[]> {
  try {
    return await fetchAllBulkServices();
  } catch (error) {
    console.error("[GET_ALL_BULK_SERVICES_ERROR]", error);
    throw new Error("Failed to fetch bulk services");
  }
}