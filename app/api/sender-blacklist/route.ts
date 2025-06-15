// app/api/sender-blacklist/route.ts
// app/api/sender-blacklist/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { SenderBlacklistWithProvider } from "@/lib/types/blacklist";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "10");
  const senderName = searchParams.get("senderName") || "";
  const providerId = searchParams.get("providerId") || "";
  const isActiveParam = searchParams.get("isActive");
  const dateFromParam = searchParams.get("dateFrom");
  const dateToParam = searchParams.get("dateTo");

  try {
    const skip = (page - 1) * pageSize;
    
    const where: any = {};
    
    // Filter by sender name
    if (senderName) {
      where.senderName = {
        contains: senderName,
        mode: "insensitive",
      };
    }
    
    // Filter by provider ID
    if (providerId) {
      where.providerId = providerId;
    }
    
    // Filter by active status
    if (isActiveParam !== null && isActiveParam !== "") {
      where.isActive = isActiveParam === "true";
    }
    
    // Filter by date range
    if (dateFromParam || dateToParam) {
      where.effectiveDate = {};
      
      if (dateFromParam) {
        where.effectiveDate.gte = new Date(dateFromParam);
      }
      
      if (dateToParam) {
        // Add 1 day to include the entire end date
        const dateTo = new Date(dateToParam);
        dateTo.setDate(dateTo.getDate() + 1);
        where.effectiveDate.lt = dateTo;
      }
    }

    const [rawEntries, total] = await Promise.all([
      db.senderBlacklist.findMany({
        skip,
        take: pageSize,
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      db.senderBlacklist.count({ where }),
    ]);

    // Add null provider to satisfy type requirements
    const entries = rawEntries.map(entry => ({
      ...entry,
      provider: null
    }));

    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      entries: entries as SenderBlacklistWithProvider[],
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("[GET_BLACKLIST_ERROR]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}