// actions/parking-services/getParkingServicesForReports.ts
"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getParkingServicesForReports() {
  try {
    const parkingServices = await db.parkingService.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        additionalEmails: true,
        isActive: true,
        contactName: true,
        phone: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return {
      success: true,
      data: parkingServices,
    };
  } catch (error: any) {
    console.error("Error fetching parking services for reports:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch parking services",
      data: [],
    };
  }
}