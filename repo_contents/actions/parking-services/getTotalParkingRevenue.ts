// actions/parking-services/getTotalParkingRevenue.ts
import { db } from "@/lib/db";

export async function getTotalParkingRevenue(parkingServiceId: string): Promise<number> {
  try {
    const result = await db.parkingTransaction.aggregate({
      where: { parkingServiceId },
      _sum: { amount: true }
    });
    
    return result._sum.amount || 0;
  } catch (error) {
    console.error("Error fetching total parking revenue:", error);
    return 0;
  }
}