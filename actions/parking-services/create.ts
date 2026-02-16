// actions/parking-services/create.ts
"use server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { parkingServiceSchema } from "@/schemas/parking-service";
import { logActivity } from "@/lib/security/audit-logger";
import type { CreateParkingServiceParams } from "@/lib/types/parking-service-types";

export async function create(data: CreateParkingServiceParams) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const validatedData = parkingServiceSchema.parse(data);

    if (validatedData.additionalEmails) {
      validatedData.additionalEmails = validatedData.additionalEmails.filter(
        email => email && email.trim() !== ''
      );
    }

    const parkingService = await db.parkingService.create({
      data: validatedData,
    });

    revalidatePath("/parking-services");

    await logActivity("CREATE_PARKING_SERVICE", {
      entityType: "parking_service",
      entityId: parkingService.id,
      userId: currentUser.id,
      details: `Created new parking service: ${parkingService.name}`,
    });

    return { success: true, data: parkingService };
  } catch (error) {
    console.error("Error creating parking service:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create parking service",
    };
  }
}