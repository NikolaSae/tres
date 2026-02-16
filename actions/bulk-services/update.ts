// actions/bulk-services/update.ts
"use server";
import { db } from "@/lib/db";
import { ServerError } from "@/lib/exceptions";
import { bulkServiceSchema } from "@/schemas/bulk-service";
import { getCurrentUser } from "@/lib/session";
import { ActivityLogService } from "@/lib/services/activity-log-service";
import { LogSeverity } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { invalidateCache } from "@/lib/cache/memory-cache";

export async function updateBulkService(id: string, data: unknown) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser?.id) {
      throw new ServerError("Unauthorized");
    }

    const validatedData = bulkServiceSchema.parse(data);

    const updatedBulkService = await db.$transaction(async (tx) => {
      const existing = await tx.bulkService.findUnique({
        where: { id },
        select: { id: true, service_name: true, provider_name: true }
      });

      if (!existing) {
        throw new ServerError("Bulk service not found");
      }

      const updated = await tx.bulkService.update({
        where: { id },
        data: {
          ...validatedData,
          updatedAt: new Date(),
        },
        include: {
          provider: {
            select: {
              id: true,
              name: true,
            }
          },
          service: {
            select: {
              id: true,
              name: true,
            }
          },
        },
      });

      await ActivityLogService.log({
        action: "UPDATE_BULK_SERVICE",
        entityType: "BULK_SERVICE",
        entityId: updated.id,
        details: `Updated bulk service: ${updated.service_name} for ${updated.provider_name}`,
        severity: LogSeverity.INFO,
        userId: currentUser.id!,
      });

      return updated;
    });

    // Invalidate cache
    invalidateCache("bulk-services:*");
    invalidateCache(`bulk-service:${id}`);
    revalidatePath("/bulk-services");
    revalidatePath(`/bulk-services/${id}`);

    return {
      success: true,
      bulkService: updatedBulkService,
      message: "Bulk servis uspešno ažuriran",
    };
  } catch (error) {
    console.error("[UPDATE_BULK_SERVICE]", error);
    
    if (error instanceof ServerError) {
      throw error;
    }

    if (error instanceof Error) {
      throw new ServerError(`Neuspešno ažuriranje bulk servisa: ${error.message}`);
    }
    
    throw new ServerError("Failed to update bulk service");
  }
}