// app/api/operators/[id]/contracts/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const operatorId = params.id;
    
    // Check if operator exists
    const operator = await db.operator.findUnique({
      where: { id: operatorId },
    });
    
    if (!operator) {
      return NextResponse.json(
        { error: "Operator not found" },
        { status: 404 }
      );
    }
    
    // Get query parameters for pagination
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const status = url.searchParams.get("status") || undefined;
    const sort = url.searchParams.get("sort") || "startDate";
    const order = url.searchParams.get("order") || "desc";
    
    // Define where clause for filtering
    const where: any = {
      operatorId
    };
    
    if (status) {
      where.status = status;
    }
    
    // Calculate skip for pagination
    const skip = (page - 1) * limit;
    
    // Get contracts associated with the operator
    const contracts = await db.contract.findMany({
      where,
      select: {
        id: true,
        name: true,
        contractNumber: true,
        type: true,
        status: true,
        startDate: true,
        endDate: true,
        revenuePercentage: true,
        operatorRevenue: true,
        isRevenueSharing: true,
        description: true,
        provider: {
          select: {
            id: true,
            name: true
          }
        },
        humanitarianOrg: {
          select: {
            id: true,
            name: true
          }
        },
        parkingService: {
          select: {
            id: true,
            name: true
          }
        },
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        [sort]: order
      },
      skip,
      take: limit
    });
    
    // Get total count for pagination
    const totalCount = await db.contract.count({ where });
    
    return NextResponse.json({
      data: contracts,
      meta: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    });
    
  } catch (error) {
    console.error("Error fetching operator contracts:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}