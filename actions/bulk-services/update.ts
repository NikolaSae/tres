//actions/bulk-services/update.ts
"use server";
import { db } from "@/lib/db";
import { ServerError } from "@/lib/exceptions";
import { bulkServiceSchema } from "@/schemas/bulk-service";
import { getCurrentUser } from "@/lib/session";
import { ActivityLogService } from "@/lib/services/activity-log-service";
import { LogSeverity } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function updateBulkService(id: string, data: unknown) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser || !currentUser.id) {
      throw new Error("Unauthorized");
    }

    const existingBulkService = await db.bulkService.findUnique({
      where: { id },
    });

    if (!existingBulkService) {
      throw new Error("Bulk service not found");
    }

    const validatedData = bulkServiceSchema.parse(data);

    const updatedBulkService = await db.bulkService.update({
      where: { id },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
      include: {
        provider: true,
        service: true,
      },
    });

    await ActivityLogService.log({
      action: "UPDATE_BULK_SERVICE",
      entityType: "BULK_SERVICE",
      entityId: updatedBulkService.id,
      details: `Updated bulk service: ${updatedBulkService.service_name} for ${updatedBulkService.provider_name}`,
      severity: LogSeverity.INFO,
      userId: currentUser.id,
    });

    revalidatePath("/bulk-services");
    revalidatePath(`/bulk-services/${id}`);

    return updatedBulkService;
  } catch (error) {
    console.error("[UPDATE_BULK_SERVICE]", error);
    throw new ServerError("Failed to update bulk service");
  }
}