///actions/bulk-services/delete.ts

"use server";

import { db } from "@/lib/db";
import { ServerError } from "@/lib/exceptions";
import { getCurrentUser } from "@/lib/session";
import { ActivityLogService } from "@/lib/services/activity-log-service";
import { LogSeverity } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function deleteBulkService(id: string) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      throw new Error("Unauthorized");
    }

    // Check if bulk service exists and get details for activity log
    const bulkService = await db.bulkService.findUnique({
      where: { id },
    });

    if (!bulkService) {
      throw new Error("Bulk service not found");
    }

    // Create a log entry first
    const logEntry = await db.logEntry.create({
      data: {
        entityType: "BULK_SERVICE",
        entityId: id,
        action: "DEACTIVATION",
        subject: `Bulk Service Deletion: ${bulkService.service_name}`,
        description: `Deleted bulk service: ${bulkService.service_name} for ${bulkService.provider_name}`,
        status: "FINISHED",
        bulkServiceId: id,
        createdById: currentUser.id,
        updatedById: currentUser.id,
      }
    });

    // Then delete the bulk service
    await db.bulkService.delete({
      where: { id },
    });

    // Log activity
    await ActivityLogService.log({
      action: "DELETE_BULK_SERVICE",
      entityType: "BULK_SERVICE",
      entityId: id,
      details: `Deleted bulk service: ${bulkService.service_name} for ${bulkService.provider_name}`,
      severity: LogSeverity.WARNING,
      userId: currentUser.id,
    });

    // Revalidate the bulk services list page
    revalidatePath("/bulk-services");

    return { success: true };
  } catch (error) {
    console.error("[DELETE_BULK_SERVICE]", error);
    throw new ServerError("Failed to delete bulk service");
  }
}