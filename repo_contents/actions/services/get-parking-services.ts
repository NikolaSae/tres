// /actions/services/get-parking-services.ts
"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function getParkingServices() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized access");
  }

  return db.parkingService.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      contactName: true,
      email: true,
      phone: true,
      address: true,
    },
  });
}