///app/api/analytics/financials/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateFinancialMetrics } from "@/lib/analytics/financial-calculations";
import { auth } from "@/auth";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const providerId = searchParams.get("providerId");

    const where: Prisma.VasServiceWhereInput = {};

    if (startDate && endDate) {
      where.mesec_pruzanja_usluge = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (providerId) where.provajderId = providerId;

    const vasServices = await db.vasService.findMany({
      where,
      include: { service: true, provider: true },
    });

    const financialMetrics = calculateFinancialMetrics(vasServices);
    return NextResponse.json(financialMetrics);
  } catch (error) {
    console.error("Error fetching financial analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch financial analytics" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const data = await request.json();
    const { startDate, endDate, providerId } = data;

    const where: Prisma.VasServiceWhereInput = {};

    if (startDate && endDate) {
      where.mesec_pruzanja_usluge = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (providerId) where.provajderId = providerId;

    const vasServices = await db.vasService.findMany({
      where,
      include: { service: true, provider: true },
    });

    const financialMetrics = calculateFinancialMetrics(vasServices);
    return NextResponse.json(financialMetrics);
  } catch (error) {
    console.error("Error processing financial analytics:", error);
    return NextResponse.json(
      { error: "Failed to process financial analytics" },
      { status: 500 }
    );
  }
}