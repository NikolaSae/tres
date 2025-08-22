//actions/bulk-services/create.ts

//actions/bulk-services/create.ts
"use server";

import { db } from "@/lib/db";
import { ServerError } from "@/lib/exceptions";
import { bulkServiceSchema } from "@/schemas/bulk-service";
import { getCurrentUser } from "@/lib/session";
import { ActivityLogService } from "@/lib/services/activity-log-service";
import { LogSeverity } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function createBulkService(data: unknown) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      throw new Error("Unauthorized");
    }

    // Validate the input data
    const validatedData = bulkServiceSchema.parse(data); // ✅ Ispravka: bulkServiceSchema

    // Create the bulk service
    const bulkService = await db.bulkService.create({
      data: {
        ...validatedData,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        provider: true,
        service: true,
      },
    });

    // Log activity
    await ActivityLogService.log({
      action: "CREATE_BULK_SERVICE",
      entityType: "BULK_SERVICE",
      entityId: bulkService.id,
      details: `Created new bulk service: ${bulkService.service_name} for ${bulkService.provider_name}`,
      severity: LogSeverity.INFO,
      userId: currentUser.id,
    });

    // Revalidate the bulk services list page
    revalidatePath("/bulk-services");

    return bulkService;
  } catch (error) {
    console.error("[CREATE_BULK_SERVICE]", error);
    throw new ServerError("Failed to create bulk service");
  }
}