// app/api/contracts/timeline/expiry/route.ts
import { connection } from 'next/server';
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { startOfMonth, endOfMonth, addMonths, format } from "date-fns";

export async function GET(request: NextRequest) {
  await connection();

  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const monthsAhead = parseInt(searchParams.get("monthsAhead") || "12");
    const includeExpired = searchParams.get("includeExpired") === "true";

    const startDate = includeExpired ? addMonths(new Date(), -3) : new Date();
    const endDate = addMonths(new Date(), monthsAhead);

    const contracts = await db.contract.findMany({
      where: {
        endDate: {
          gte: startOfMonth(startDate),
          lte: endOfMonth(endDate),
        },
        status: {
          in: ["ACTIVE", "EXPIRED", "RENEWAL_IN_PROGRESS", "PENDING"]
        }
      },
      select: {
        id: true,
        contractNumber: true,
        name: true,
        type: true,
        endDate: true,
        status: true,
        provider: { select: { name: true } },
        humanitarianOrg: { select: { name: true } },
        parkingService: { select: { name: true } },
        renewals: { select: { id: true } }
      },
      orderBy: { endDate: 'asc' }
    });

    const timelineData = [];
    let currentDate = startOfMonth(startDate);

    while (currentDate <= endOfMonth(endDate)) {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);

      const monthContracts = contracts.filter(contract => {
        const contractEndDate = new Date(contract.endDate);
        return contractEndDate >= monthStart && contractEndDate <= monthEnd;
      });

      const contractsByType = { provider: 0, humanitarian: 0, parking: 0 };

      monthContracts.forEach(contract => {
        switch (contract.type) {
          case "PROVIDER":     contractsByType.provider++; break;
          case "HUMANITARIAN": contractsByType.humanitarian++; break;
          case "PARKING":      contractsByType.parking++; break;
        }
      });

      timelineData.push({
        month: format(currentDate, "MMM yyyy"),
        date: currentDate,
        provider: contractsByType.provider,
        humanitarian: contractsByType.humanitarian,
        parking: contractsByType.parking,
        total: monthContracts.length,
        contracts: monthContracts.map(c => ({
          id: c.id,
          contractNumber: c.contractNumber,
          organizationName: c.provider?.name || c.humanitarianOrg?.name || c.parkingService?.name || c.name,
          type: c.type,
          endDate: c.endDate,
          status: c.status,
          hasRenewal: c.renewals.length > 0
        }))
      });

      currentDate = addMonths(currentDate, 1);
    }

    return NextResponse.json(timelineData.filter(item => item.total > 0));

  } catch (error) {
    console.error("Error fetching expiry timeline data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}