// app/api/providers/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    // Use getServerSession with authOptions
    const session = await auth();
    const user = session?.user;

    // Authorization check
    if (!session) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    if (![UserRole.ADMIN, UserRole.MANAGER].includes(user?.role as UserRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const skip = (page - 1) * limit;
    
    // Get all parameters
    const searchTerm = searchParams.get("search") || undefined;
    const isActiveParam = searchParams.get("isActive");
    const isActive = isActiveParam ? isActiveParam === "true" : undefined;
    const hasContracts = searchParams.get("hasContracts") === "true";
    const hasComplaints = searchParams.get("hasComplaints") === "true";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortDirection = searchParams.get("sortDirection") || "desc";

    // Build where clause
    const where: any = {};
    
    // Fixed: Use searchTerm instead of search
    if (searchTerm) {
      where.OR = [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { contactName: { contains: searchTerm, mode: "insensitive" } },
        { email: { contains: searchTerm, mode: "insensitive" } },
      ];
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    
    if (hasContracts) {
      where.contracts = { some: {} };
    }
    
    if (hasComplaints) {
      where.complaints = { some: {} };
    }

    // Create sorting
    const orderBy: any = {};
    orderBy[sortBy] = sortDirection;

    // Execute queries
    const [providers, total] = await Promise.all([
      db.provider.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              contracts: true,
              complaints: true,
              vasServices: true,
              bulkServices: true,
            },
          },
        },
      }),
      db.provider.count({ where }),
    ]);

    return NextResponse.json({
      items: providers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("Provider API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch providers", details: error.message },
      { status: 500 }
    );
  }
}