// app/api/contracts/statistics/expiry/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
    const sixtyDaysFromNow = new Date(now.getTime() + (60 * 24 * 60 * 60 * 1000));

    // Get total contracts expiring in the next 60 days or already expired
    const totalExpiringContracts = await db.contract.findMany({
      where: {
        OR: [
          {
            endDate: {
              lte: sixtyDaysFromNow
            }
          },
          {
            endDate: {
              lt: now
            }
          }
        ]
      },
      include: {
        renewals: true,
        provider: { select: { name: true } },
        humanitarianOrg: { select: { name: true } },
        parkingService: { select: { name: true } }
      }
    });

    // Calculate statistics
    const expiredCount = totalExpiringContracts.filter(contract => 
      new Date(contract.endDate) < now
    ).length;

    const expiringIn30Days = totalExpiringContracts.filter(contract => {
      const endDate = new Date(contract.endDate);
      return endDate >= now && endDate <= thirtyDaysFromNow;
    }).length;

    const expiringIn60Days = totalExpiringContracts.filter(contract => {
      const endDate = new Date(contract.endDate);
      return endDate > thirtyDaysFromNow && endDate <= sixtyDaysFromNow;
    }).length;

    // Calculate average days to expiry (only for future contracts)
    const futureContracts = totalExpiringContracts.filter(contract => 
      new Date(contract.endDate) >= now
    );
    
    const totalDaysToExpiry = futureContracts.reduce((sum, contract) => {
      const daysToExpiry = Math.ceil((new Date(contract.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return sum + Math.max(0, daysToExpiry);
    }, 0);

    const averageDaysToExpiry = futureContracts.length > 0 
      ? Math.round(totalDaysToExpiry / futureContracts.length) 
      : 0;

    // Group by contract type
    const contractsByType = totalExpiringContracts.reduce((acc, contract) => {
      const existing = acc.find(item => item.type === contract.type);
      if (existing) {
        existing.count++;
      } else {
        const typeLabels = {
          HUMANITARIAN_AID: 'Humanitarni',
          SERVICE_PROVIDER: 'Pružaoci usluga',
          PARKING_SERVICE: 'Parking servisi'
        };
        acc.push({
          type: contract.type,
          count: 1,
          label: typeLabels[contract.type as keyof typeof typeLabels] || contract.type
        });
      }
      return acc;
    }, [] as Array<{ type: string; count: number; label: string }>);

    // Calculate renewal statistics
    const withRenewal = totalExpiringContracts.filter(contract => 
      contract.renewals && contract.renewals.length > 0
    ).length;
    
    const withoutRenewal = totalExpiringContracts.length - withRenewal;

    const statistics = {
      totalExpiring: totalExpiringContracts.length,
      expiredCount,
      expiringIn30Days,
      expiringIn60Days,
      averageDaysToExpiry,
      contractsByType,
      renewalStats: {
        withRenewal,
        withoutRenewal
      }
    };

    return NextResponse.json(statistics);

  } catch (error) {
    console.error("Error fetching expiry statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch expiry statistics" },
      { status: 500 }
    );
  }
}