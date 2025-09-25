// actions/parking-services/getParkingServiceStats.ts
import { db } from "@/lib/db";

export async function getParkingServiceStats(parkingServiceId: string) {
  try {
    const [totalTransactions, activeContracts] = await Promise.all([
      db.parkingTransaction.count({
        where: { parkingServiceId }
      }),
      db.contract.count({
        where: { 
          parkingServiceId,
          status: "ACTIVE"
        }
      })
    ]);
    
    return {
      totalTransactions,
      activeContracts
    };
  } catch (error) {
    console.error("Error fetching parking service stats:", error);
    return {
      totalTransactions: 0,
      activeContracts: 0
    };
  }
}