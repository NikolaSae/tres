//actions/parking-services/create.ts
"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { CreateParkingServiceParams } from "@/lib/types/parking-service-types";
import { createParkingServiceSchema } from "@/schemas/parking-service";
import { logActivity } from "@/lib/security/audit-logger"; // Corrected import

export async function create(data: CreateParkingServiceParams) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      // For create actions, unauthorized means the user cannot proceed
      return { success: false, error: "Unauthorized" };
    }

    const validatedData = createParkingServiceSchema.parse(data);

    // Filter out empty additional emails if they exist
    if (validatedData.additionalEmails) {
      validatedData.additionalEmails = validatedData.additionalEmails.filter(
        email => email && email.trim() !== ''
      );
    }

    const parkingService = await db.parkingService.create({
      data: validatedData,
    });

    revalidatePath("/parking-services");

    await logActivity("CREATE_PARKING_SERVICE", { // Corrected function call and arguments
      entityType: "parking_service",
      entityId: parkingService.id,
      userId: currentUser.id,
      details: `Created new parking service: ${parkingService.name}`,
    });

    // Return the created parking service data
    return { success: true, data: parkingService };

  } catch (error) {
    console.error("Error creating parking service:", error);
     // Handle Zod validation errors specifically if needed
     // if (error instanceof z.ZodError) { ... }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create parking service",
    };
  }
}