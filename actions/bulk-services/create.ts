// actions/bulk-services/create.ts
"use server";
import { db } from "@/lib/db";
import { ServerError } from "@/lib/exceptions";
import { bulkServiceSchema } from "@/schemas/bulk-service";
import { getCurrentUser } from "@/lib/session";
import { ActivityLogService } from "@/lib/services/activity-log-service";
import { LogSeverity } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { invalidateCache } from "@/lib/cache/memory-cache";

export async function createBulkService(data: unknown) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser?.id) {
      throw new ServerError("Unauthorized – korisnik nije prijavljen");
    }
    
    const validatedData = bulkServiceSchema.parse(data);

    const bulkService = await db.$transaction(async (tx) => {
      const newBulkService = await tx.bulkService.create({
        data: {
          ...validatedData,
          createdAt: new Date(),
          updatedAt: new Date(),
          datumNaplate: new Date(),
        },
        include: {
          provider: {
            select: { id: true, name: true }
          },
          service: {
            select: { id: true, name: true }
          },
        },
      });

      await ActivityLogService.log({
        action: "CREATE_BULK_SERVICE",
        entityType: "BULK_SERVICE",
        entityId: newBulkService.id,
        details: `Kreiran novi bulk servis: ${newBulkService.service_name} za ${newBulkService.provider_name}`,
        severity: LogSeverity.INFO,
        userId: currentUser.id!,
      });

      return newBulkService;
    });

    // Invalidate cache
    invalidateCache("bulk-services:*");
    invalidateCache("bulk-service:*");
    revalidatePath("/bulk-services");

    return {
      success: true,
      bulkService,
      message: "Bulk servis uspešno kreiran",
    };
  } catch (error) {
    console.error("[CREATE_BULK_SERVICE]", error);
    
    if (error instanceof Error) {
      throw new ServerError(`Neuspešno kreiranje bulk servisa: ${error.message}`);
    }
    
    throw new ServerError("Neočekivana greška prilikom kreiranja bulk servisa");
  }
}