//actions/parking-services/getContractsByParkingServiceId.ts

"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
// import { ActivityLogCreate } from "@/lib/activity-log";

/**
 * Get contracts associated with a parking service
 * @param parkingServiceId - Parking service ID
 * @returns List of contracts associated with the parking service
 */
export async function getContractsByParkingServiceId(parkingServiceId: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("Unauthorized");
    }

    // Verify parking service exists
    const parkingService = await db.parkingService.findUnique({
      where: { id: parkingServiceId },
    });

    if (!parkingService) {
      return { success: false, error: "Parking service not found" };
    }

    // Fetch contracts associated with the parking service
    const contracts = await db.contract.findMany({
      where: { parkingServiceId },
      select: {
        id: true,
        name: true,
        contractNumber: true,
        status: true,
        startDate: true,
        endDate: true,
        revenuePercentage: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Log the activity
    // await ActivityLogCreate({
    //  action: "GET_CONTRACTS_BY_PARKING_SERVICE_ID",
    //  entityType: "parking_service",
    //  entityId: parkingServiceId,
    //  userId: currentUser.id,
    //  details: `Retrieved contracts for parking service with ID: ${parkingServiceId}`,
  //  });

    return { success: true, data: contracts };
  } catch (error) {
    console.error("Error fetching contracts for parking service:", error);
    return {
      success: false,
      error: error instanceof Error 
        ? error.message 
        : "Failed to fetch contracts for parking service",
    };
  }
}