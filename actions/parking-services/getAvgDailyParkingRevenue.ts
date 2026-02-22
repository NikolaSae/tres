// actions/parking-services/getAvgDailyParkingRevenue.ts
import { db } from "@/lib/db";
import { subDays } from "date-fns";

export async function getAvgDailyParkingRevenue(parkingServiceId: string): Promise<number> {
  try {
    const result = await db.parkingTransaction.aggregate({
      where: { parkingServiceId },
      _sum: { amount: true },
      _min: { date: true },
      _max: { date: true },
    });

    const totalRevenue = result._sum.amount || 0;
    const minDate = result._min.date;
    const maxDate = result._max.date;

    if (!minDate || !maxDate || totalRevenue === 0) return 0;

    const diffMs = maxDate.getTime() - minDate.getTime();
    const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    return totalRevenue / diffDays;
  } catch (error) {
    console.error("Error fetching average daily parking revenue:", error);
    return 0;
  }
}