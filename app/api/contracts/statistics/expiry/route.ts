// app/api/contracts/statistics/expiry/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);
    
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(now.getDate() + 60);

    // Get all contracts for statistics
    const allContracts = await db.contract.findMany({
      where: {
        // Include all contracts that are expiring within 60 days or already expired
        endDate: {
          lte: sixtyDaysFromNow
        }
      },
      select: {
        id: true,
        type: true,
        status: true,
        endDate: true,
        // Remove renewalClause field - doesn't exist
        renewals: {
          select: {
            id: true
          }
        }
      }
    });

    // Calculate statistics
    const statistics = {
      totalExpiring: 0,
      expiredCount: 0,
      expiringIn30Days: 0,
      expiringIn60Days: 0,
      averageDaysToExpiry: 0,
      contractsByType: [] as Array<{
        type: string;
        count: number;
        label: string;
      }>,
      renewalStats: {
        withRenewal: 0,
        withoutRenewal: 0
      }
    };

    // Type labels mapping - use correct enum values
    const typeLabels = {
      'HUMANITARIAN': 'Humanitarna pomoć',
      'PROVIDER': 'Pružalac usluga',
      'PARKING': 'Parking servis',
      'BULK': 'Bulk ugovori'
    };

    // Count by type
    const typeCounts: Record<string, number> = {};
    let totalDaysToExpiry = 0;
    let validDaysCount = 0;

    allContracts.forEach(contract => {
      const endDate = new Date(contract.endDate);
      const daysToExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      // Count total expiring (within 60 days or expired)
      if (daysToExpiry <= 60) {
        statistics.totalExpiring++;
      }

      // Count expired
      if (daysToExpiry < 0) {
        statistics.expiredCount++;
      }

      // Count expiring in 30 days
      if (daysToExpiry >= 0 && daysToExpiry <= 30) {
        statistics.expiringIn30Days++;
      }

      // Count expiring in 60 days
      if (daysToExpiry >= 0 && daysToExpiry <= 60) {
        statistics.expiringIn60Days++;
      }

      // Calculate average days to expiry (only for future contracts)
      if (daysToExpiry >= 0) {
        totalDaysToExpiry += daysToExpiry;
        validDaysCount++;
      }

      // Count by type
      const type = contract.type;
      typeCounts[type] = (typeCounts[type] || 0) + 1;

      // Count renewal stats - check if has renewal records
      if (contract.renewals && contract.renewals.length > 0) {
        statistics.renewalStats.withRenewal++;
      } else {
        statistics.renewalStats.withoutRenewal++;
      }
    });

    // Calculate average
    statistics.averageDaysToExpiry = validDaysCount > 0 
      ? Math.round(totalDaysToExpiry / validDaysCount) 
      : 0;

    // Format contracts by type
    statistics.contractsByType = Object.entries(typeCounts).map(([type, count]) => ({
      type,
      count,
      label: typeLabels[type as keyof typeof typeLabels] || type
    }));

    return NextResponse.json(statistics);
  } catch (error) {
    console.error("Error fetching expiry statistics:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}