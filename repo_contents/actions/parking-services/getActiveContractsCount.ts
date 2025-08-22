// actions/parking-services/getActiveContractsCount.ts
import { db } from "@/lib/db";

export async function getActiveContractsCount(parkingServiceId: string) {
  try {
    return await db.contract.count({
      where: {
        parkingServiceId,
        status: "ACTIVE",
      },
    });
  } catch (error) {
    console.error("Error fetching active contracts count:", error);
    return 0;
  }
}