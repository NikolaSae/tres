//actions/parking-services/update.ts
"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { UpdateParkingServiceParams } from "@/lib/types/parking-service-types";
import { updateParkingServiceSchema } from "@/schemas/parking-service";
import { logActivity } from "@/lib/security/audit-logger";

export async function update(data: UpdateParkingServiceParams) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const validatedData = updateParkingServiceSchema.parse(data);
    const { id, ...updateData } = validatedData;

    const existingParkingService = await db.parkingService.findUnique({
      where: { id },
    });

    if (!existingParkingService) {
      return { success: false, error: "Parking service not found" };
    }

    const updatedParkingService = await db.parkingService.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/parking-services");
    revalidatePath(`/parking-services/${id}`);

    await logActivity("UPDATE_PARKING_SERVICE", {
      entityType: "parking_service",
      entityId: id,
      userId: currentUser.id,
      details: `Updated parking service: ${updatedParkingService.name}`,
    });

    return { success: true, data: updatedParkingService };
  } catch (error) {
    console.error("Error updating parking service:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update parking service",
    };
  }
}
