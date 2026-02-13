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
    
    // Calculate financial metrics - removed second argument
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
    // Check authentication - use auth() instead of getServerSession
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get user role - session.user already has role from extended type
    const userRole = session.user.role;
    
    // Check if user has permission
    if (!userRole || !["ADMIN", "MANAGER"].includes(userRole)) {
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
    
    // Calculate financial metrics - removed second and third arguments
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