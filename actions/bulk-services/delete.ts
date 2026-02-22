// actions/bulk-services/delete.ts
"use server";
import { db } from "@/lib/db";
import { ServerError } from "@/lib/exceptions";
import { getCurrentUser } from "@/lib/session";
import { ActivityLogService } from "@/lib/services/activity-log-service";
import { LogSeverity } from "@prisma/client";
import { revalidatePath, updateTag } from "next/cache";

export async function deleteBulkService(id: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.id) throw new ServerError("Unauthorized");

    const result = await db.$transaction(async (tx) => {
      const bulkService = await tx.bulkService.findUnique({
        where: { id },
        select: { id: true, service_name: true, provider_name: true },
      });

      if (!bulkService) throw new ServerError("Bulk service not found");

      await tx.logEntry.create({
        data: {
          entityType: "BULK_SERVICE",
          entityId: id,
          action: "DEACTIVATION",
          subject: `Bulk Service Deletion: ${bulkService.service_name}`,
          description: `Deleted bulk service: ${bulkService.service_name} for ${bulkService.provider_name}`,
          status: "FINISHED",
          bulkServiceId: id,
          createdById: currentUser.id!,
          updatedById: currentUser.id!,
        },
      });

      await tx.bulkService.delete({ where: { id } });

      await ActivityLogService.log({
        action: "DELETE_BULK_SERVICE",
        entityType: "BULK_SERVICE",
        entityId: id,
        details: `Deleted bulk service: ${bulkService.service_name} for ${bulkService.provider_name}`,
        severity: LogSeverity.WARNING,
        userId: currentUser.id!,
      });

      return bulkService;
    });

    updateTag("bulk-services");
    updateTag(`bulk-service:${id}`);
    revalidatePath("/bulk-services");

    return { success: true };
  } catch (error) {
    console.error("[DELETE_BULK_SERVICE]", error);
    if (error instanceof ServerError) throw error;
    throw new ServerError("Failed to delete bulk service");
  }
}