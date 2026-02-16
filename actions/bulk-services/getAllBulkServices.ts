// actions/bulk-services/getAllBulkServices.ts
"use server";
import { db } from "@/lib/db";
import { BulkService } from "@prisma/client";
import { getCachedData } from "@/lib/cache/memory-cache";

type BulkServiceWithRelations = BulkService & {
  provider: { name: string };
  service: { name: string };
};

export async function getAllBulkServices(): Promise<BulkServiceWithRelations[]> {
  try {
    return await getCachedData(
      "bulk-services:all",
      async () => {
        return await db.bulkService.findMany({
          orderBy: {
            createdAt: "desc"
          },
          include: {
            provider: {
              select: {
                name: true
              }
            },
            service: {
              select: {
                name: true
              }
            }
          }
        });
      },
      300 // cache 60 sekundi
    );
  } catch (error) {
    console.error("[GET_ALL_BULK_SERVICES_ERROR]", error);
    throw new Error("Failed to fetch bulk services");
  }
}