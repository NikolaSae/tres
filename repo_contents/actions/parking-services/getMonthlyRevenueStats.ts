// actions/parking-services/getMonthlyRevenueStats.ts
import { db } from "@/lib/db";

export interface MonthlyRevenueStat {
  month_start: Date;
  month_year: string;
  total_amount: number;
  total_quantity: number;
  average_price: number;
}

export async function getMonthlyRevenueStats(parkingServiceId: string): Promise<MonthlyRevenueStat[]> {
  try {
    return await db.$queryRaw`
      SELECT
        DATE_TRUNC('month', "date") AS month_start,
        TO_CHAR(DATE_TRUNC('month', "date"), 'YYYY-MM') AS month_year,
        SUM(amount) AS total_amount,
        SUM(quantity) AS total_quantity,
        AVG(price) AS average_price
      FROM "ParkingTransaction"
      WHERE "parkingServiceId" = ${parkingServiceId}
      GROUP BY DATE_TRUNC('month', "date")
      ORDER BY DATE_TRUNC('month', "date") DESC
    `;
  } catch (error) {
    console.error("Error fetching monthly revenue statistics:", error);
    return [];
  }
}