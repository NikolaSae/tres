// app/api/contracts/timeline/expiry/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { startOfMonth, endOfMonth, addMonths, format } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const monthsAhead = parseInt(searchParams.get("monthsAhead") || "12");
    const includeExpired = searchParams.get("includeExpired") === "true";
    
    // Calculate date range
    const startDate = includeExpired 
      ? addMonths(new Date(), -3) // Include 3 months back for expired contracts
      : new Date();
    const endDate = addMonths(new Date(), monthsAhead);

    // Fetch contracts within the date range
    const contracts = await db.contract.findMany({
      where: {
        endDate: {
          gte: startOfMonth(startDate),
          lte: endOfMonth(endDate),
        },
        // Only include valid contract statuses from your enum
        status: {
          in: ["ACTIVE", "EXPIRED", "RENEWAL_IN_PROGRESS", "PENDING"]
        }
      },
      select: {
        id: true,
        contractNumber: true,
        name: true, // Use 'name' instead of 'organizationName'
        type: true,
        endDate: true,
        status: true,
        // Remove renewalClause - doesn't exist in schema
        // Get organization name from relations
        provider: {
          select: {
            name: true
          }
        },
        humanitarianOrg: {
          select: {
            name: true
          }
        },
        parkingService: {
          select: {
            name: true
          }
        },
        // Check if has renewal records
        renewals: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        endDate: 'asc'
      }
    });

    // Group contracts by month
    const timelineData = [];
    let currentDate = startOfMonth(startDate);

    while (currentDate <= endOfMonth(endDate)) {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      
      // Filter contracts expiring in this month
      const monthContracts = contracts.filter(contract => {
        const contractEndDate = new Date(contract.endDate);
        return contractEndDate >= monthStart && contractEndDate <= monthEnd;
      });

      // Group by contract type
      const contractsByType = {
        provider: 0,
        humanitarian: 0,
        parking: 0,
      };

      monthContracts.forEach(contract => {
        switch (contract.type) {
          case "PROVIDER":
            contractsByType.provider++;
            break;
          case "HUMANITARIAN":
            contractsByType.humanitarian++;
            break;
          case "PARKING":
            contractsByType.parking++;
            break;
        }
      });

      // Add data point for this month
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

    // Filter out months with no contracts (optional)
    const filteredData = timelineData.filter(item => item.total > 0);

    return NextResponse.json(filteredData);
  } catch (error) {
    console.error("Error fetching expiry timeline data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}