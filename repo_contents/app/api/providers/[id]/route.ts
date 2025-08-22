// /app/api/providers/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user;

    if (!user || ![UserRole.ADMIN, UserRole.MANAGER].includes(user.role as UserRole)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "12");
    const search = searchParams.get("search") || undefined;
    const isActive = searchParams.get("isActive")
      ? searchParams.get("isActive") === "true"
      : undefined;
    const hasContracts = searchParams.get("hasContracts") === "true";
    const hasComplaints = searchParams.get("hasComplaints") === "true";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortDirection = searchParams.get("sortDirection") || "desc";

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { contactName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
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

    const orderBy: any = {};
    orderBy[sortBy] = sortDirection;

    const [providers, total] = await Promise.all([
      db.provider.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          contactName: true,
          email: true,
          phone: true,
          isActive: true,
          imageUrl: true, // Include the imageUrl field
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
    });
  } catch (error) {
    console.error("Provider API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch providers" },
      { status: 500 }
    );
  }
}