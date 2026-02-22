// app/api/contracts/statistics/expiry/route.ts
import { connection } from 'next/server';
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth"; // ← ispravljeno iz @/lib/auth

export async function GET(request: NextRequest) {
  await connection();

  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
    const sixtyDaysFromNow = new Date(now.getTime() + (60 * 24 * 60 * 60 * 1000));

    const totalExpiringContracts = await db.contract.findMany({
      where: {
        OR: [
          { endDate: { lte: sixtyDaysFromNow } },
          { endDate: { lt: now } }
        ]
      },
      include: {
        renewals: true,
        provider: { select: { name: true } },
        humanitarianOrg: { select: { name: true } },
        parkingService: { select: { name: true } }
      }
    });

    const expiredCount = totalExpiringContracts.filter(c =>
      new Date(c.endDate) < now
    ).length;

    const expiringIn30Days = totalExpiringContracts.filter(c => {
      const endDate = new Date(c.endDate);
      return endDate >= now && endDate <= thirtyDaysFromNow;
    }).length;

    const expiringIn60Days = totalExpiringContracts.filter(c => {
      const endDate = new Date(c.endDate);
      return endDate > thirtyDaysFromNow && endDate <= sixtyDaysFromNow;
    }).length;

    const futureContracts = totalExpiringContracts.filter(c =>
      new Date(c.endDate) >= now
    );

    const totalDaysToExpiry = futureContracts.reduce((sum, c) => {
      const days = Math.ceil((new Date(c.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return sum + Math.max(0, days);
    }, 0);

    const averageDaysToExpiry = futureContracts.length > 0
      ? Math.round(totalDaysToExpiry / futureContracts.length)
      : 0;

    const typeLabels: Record<string, string> = {
      HUMANITARIAN: 'Humanitarni',
      PROVIDER: 'Pružaoci usluga',
      PARKING: 'Parking servisi',
      BULK: 'Bulk ugovori'
    };

    const contractsByType = totalExpiringContracts.reduce((acc, contract) => {
      const existing = acc.find(item => item.type === contract.type);
      if (existing) {
        existing.count++;
      } else {
        acc.push({
          type: contract.type,
          count: 1,
          label: typeLabels[contract.type] || contract.type
        });
      }
      return acc;
    }, [] as Array<{ type: string; count: number; label: string }>);

    const withRenewal = totalExpiringContracts.filter(c =>
      c.renewals && c.renewals.length > 0
    ).length;

    return NextResponse.json({
      totalExpiring: totalExpiringContracts.length,
      expiredCount,
      expiringIn30Days,
      expiringIn60Days,
      averageDaysToExpiry,
      contractsByType,
      renewalStats: {
        withRenewal,
        withoutRenewal: totalExpiringContracts.length - withRenewal
      }
    });

  } catch (error) {
    console.error("Error fetching expiry statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch expiry statistics" },
      { status: 500 }
    );
  }
}