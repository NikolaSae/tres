//actions/parking-services/delete.ts

//actions/parking-services/delete.ts

"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/security/audit-logger"; // Corrected import

export async function deleteService(id: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("Unauthorized");
    }

    const existingParkingService = await db.parkingService.findUnique({
      where: { id },
      include: {
        contracts: true,
      }
    });

    if (!existingParkingService) {
      return { success: false, error: "Parking service not found" };
    }

    if (existingParkingService.contracts.length > 0) {
      return {
        success: false,
        error: "Cannot delete parking service with associated contracts"
      };
    }

    await db.parkingService.delete({
      where: { id },
    });

    revalidatePath("/parking-services");

    await logActivity("DELETE_PARKING_SERVICE", { // Corrected function call and arguments
      entityType: "parking_service",
      entityId: id,
      userId: currentUser.id,
      details: `Deleted parking service: ${existingParkingService.name}`,
    });

    return { success: true, message: "Parking service deleted successfully" };
  } catch (error) {
    console.error("Error deleting parking service:", error);
    if (error instanceof Error) {
         const prismaError = error as any;
         if (prismaError.code === 'P2025') {
              return { error: "Parking service not found.", success: false };
         }
         if (prismaError.code === 'P2003') {
              return { error: "Cannot delete parking service because it is linked to other records (e.g., contracts).", success: false };
         }
     }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete parking service",
    };
  }
}