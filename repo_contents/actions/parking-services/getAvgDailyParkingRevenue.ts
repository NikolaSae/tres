// actions/parking-services/getAvgDailyParkingRevenue.ts
import { db } from "@/lib/db";
import { subDays } from "date-fns";

export async function getAvgDailyParkingRevenue(parkingServiceId: string): Promise<number> {
  try {
    // Get revenue for the last 30 days
    const thirtyDaysAgo = subDays(new Date(), 30);
    
    const result = await db.parkingTransaction.aggregate({
      where: { 
        parkingServiceId,
        date: { gte: thirtyDaysAgo }
      },
      _sum: { amount: true }
    });
    
    const totalRevenue = result._sum.amount || 0;
    return totalRevenue / 30;
  } catch (error) {
    console.error("Error fetching average daily parking revenue:", error);
    return 0;
  }
}