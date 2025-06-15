//actions/parking-services/getParkingServiceById.ts
"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";


export async function getParkingServiceById(id: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const parkingService = await db.parkingService.findUnique({
      where: { id },
    });

    if (!parkingService) {
      return { success: false, error: "Parking service not found" };
    }

    

    return { success: true, data: parkingService };
  } catch (error) {
    console.error("Error fetching parking service:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch parking service",
    };
  }
}
