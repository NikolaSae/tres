///app/api/analytics/financials/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateFinancialMetrics } from "@/lib/analytics/financial-calculations";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const providerId = searchParams.get("providerId");
    
    // Build query conditions
    const where: any = {};
    
    if (startDate && endDate) {
      where.mesec_pruzanja_usluge = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }
    
    if (providerId) {
      where.provajderId = providerId;
    }
    
    // Get VAS service financial data
    const vasServices = await db.vasService.findMany({
      where,
      include: {
        service: true,
        provider: true,
      },
    });
    
    // Get contract revenue data
    const contracts = await db.contract.findMany({
      where: {
        status: "ACTIVE",
        ...(providerId ? { providerId } : {}),
      },
      select: {
        id: true,
        name: true,
        contractNumber: true,
        revenuePercentage: true,
        provider: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    // Calculate financial metrics
    const financialMetrics = calculateFinancialMetrics(vasServices, contracts);
    
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
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get user role
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    
    // Check if user has permission
    if (!user || !["ADMIN", "MANAGER"].includes(user.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }
    
    // Parse request body
    const data = await request.json();
    
    // Filter options
    const {
      startDate,
      endDate,
      providerId,
      serviceTypes,
      groupBy,
    } = data;
    
    // Build query conditions
    const where: any = {};
    
    if (startDate && endDate) {
      where.mesec_pruzanja_usluge = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }
    
    if (providerId) {
      where.provajderId = providerId;
    }
    
    // Get VAS service financial data
    const vasServices = await db.vasService.findMany({
      where,
      include: {
        service: true,
        provider: true,
      },
    });
    
    // Get contract revenue data
    const contracts = await db.contract.findMany({
      where: {
        status: "ACTIVE",
        ...(providerId ? { providerId } : {}),
      },
      select: {
        id: true,
        name: true,
        contractNumber: true,
        revenuePercentage: true,
        provider: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    // Calculate financial metrics with custom grouping
    const financialMetrics = calculateFinancialMetrics(
      vasServices,
      contracts,
      { groupBy }
    );
    
    return NextResponse.json(financialMetrics);
  } catch (error) {
    console.error("Error processing financial analytics:", error);
    return NextResponse.json(
      { error: "Failed to process financial analytics" },
      { status: 500 }
    );
  }
}