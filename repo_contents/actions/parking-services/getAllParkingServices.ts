//actions/parking-services/getAllParkingServices.ts


"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
// import { ActivityLogCreate } from "@/lib/activity-log";
import { getCurrentUser } from "@/lib/auth";

/**
 * Get all parking services
 * @returns Array of all parking services
 */
export async function getAllParkingServices() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("Unauthorized");
    }

    const parkingServices = await db.parkingService.findMany({
      orderBy: {
        name: "asc",
      },
    });

    // Log the activity
    // await ActivityLogCreate({
    //  action: "GET_ALL_PARKING_SERVICES",
    //  entityType: "parking_service",
    //  userId: currentUser.id,
    //  details: `Retrieved all parking services`,
   // });

    return { success: true, data: parkingServices };
  } catch (error) {
    console.error("Error fetching parking services:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch parking services" 
    };
  }
}