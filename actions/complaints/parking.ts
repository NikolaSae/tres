// Path: actions/complaints/parking.ts
"use server";
import { db } from "@/lib/db";

export async function getParkingServices() {
  try {
    return await db.parkingService.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Error fetching parking services:", error);
    return [];
  }
}