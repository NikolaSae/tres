//actions/bulk-services/getAllBulkServices.ts

"use server";

import { db } from "@/lib/db";
import { BulkService } from "@prisma/client";

type BulkServiceWithRelations = BulkService & {
  provider: { name: string };
  service: { name: string };
};

export async function getAllBulkServices(): Promise<BulkServiceWithRelations[]> {
  try {
    const bulkServices = await db.bulkService.findMany({
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
    
    return bulkServices;
  } catch (error) {
    console.error("[GET_ALL_BULK_SERVICES_ERROR]", error);
    throw new Error("Failed to fetch bulk services");
  }
}