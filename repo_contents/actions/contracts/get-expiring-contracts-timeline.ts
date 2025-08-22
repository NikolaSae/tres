// actions/contracts/get-expiring-contracts-timeline.ts
import { db } from "@/lib/db";
import { addDays, startOfDay, endOfDay } from 'date-fns'; // Fixed import

export async function getExpiringContractsTimeline(daysThreshold: number = 30) {
  try {
    const today = startOfDay(new Date());
    const expiryDateThreshold = endOfDay(addDays(today, daysThreshold));

    const contracts = await db.contract.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          gte: today,
          lte: expiryDateThreshold,
        },
      },
      select: { // Changed from include to select for scalar fields
        endDate: true,
        type: true, // This is a scalar field, not a relation
      },
    });

    // Debug log
    console.log(`Found ${contracts.length} contracts for timeline`);

    // Grupisanje po mesecima
    const grouped = contracts.reduce((acc, contract) => {
      const monthKey = contract.endDate.toISOString().slice(0, 7); // YYYY-MM
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthKey,
          date: new Date(contract.endDate),
          provider: 0,
          humanitarian: 0,
          parking: 0,
          bulk: 0,
          total: 0,
        };
      }
      
      // Use the contract type directly
      const type = contract.type.toLowerCase();
      if (type in acc[monthKey]) {
        acc[monthKey][type] += 1;
        acc[monthKey].total += 1;
      }
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped).sort((a, b) => a.date.getTime() - b.date.getTime());

  } catch (error) {
    console.error("Failed to fetch expiring contracts timeline:", error);
    return [];
  }
}