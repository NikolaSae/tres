// actions/parking-services/getParkingServiceStats.ts
import { db } from "@/lib/db";

export async function getParkingServiceStats(parkingServiceId: string) {
  try {
    const [transactionStats, activeContracts] = await Promise.all([
      db.parkingTransaction.aggregate({
        where: { parkingServiceId },
        _count: { id: true },
        _sum: { quantity: true },
      }),
      db.contract.count({
        where: { parkingServiceId, status: "ACTIVE" }
      })
    ]);

    return {
      totalTransactions: transactionStats._sum.quantity || transactionStats._count.id || 0,
      totalRecords: transactionStats._count.id || 0,
      activeContracts
    };
  } catch (error) {
    console.error("Error fetching parking service stats:", error);
    return { totalTransactions: 0, totalRecords: 0, activeContracts: 0 };
  }
}
    
