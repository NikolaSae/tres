// Path: actions/complaints/parking.ts

import { db } from "@/lib/db";

/**
 * Fetches all parking services
 * @returns Array of parking services with id and name
 */
export async function getParkingServices() {
  try {
    const services = await db.parkingService.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return services;
  } catch (error) {
    console.error("Error fetching parking services:", error);
    return [];
  }
}