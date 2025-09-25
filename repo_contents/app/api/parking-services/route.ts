//app/api/parking-services/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { parkingServiceSchema } from "@/lib/parking-services/validators";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name") || undefined;
    const isActive = searchParams.has("isActive") 
      ? searchParams.get("isActive") === "true" 
      : undefined;
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    const sortBy = searchParams.get("sortBy") || "name";
    const sortOrder = searchParams.get("sortOrder") || "asc";

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: any = {};
    
    if (name) {
      where.name = {
        contains: name,
        mode: "insensitive",
      };
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Execute query with filters and pagination
    const [parkingServices, totalCount] = await Promise.all([
      db.parkingService.findMany({
        where,
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      db.parkingService.count({ where }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      data: parkingServices,
      meta: {
        page,
        limit,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching parking services:", error);
    return NextResponse.json(
      { error: "Failed to fetch parking services" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    
    // Validate request body
    const validationResult = parkingServiceSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    // Create new parking service
    const parkingService = await db.parkingService.create({
      data: {
        name: validationResult.data.name,
        description: validationResult.data.description || null,
        contactName: validationResult.data.contactName || null,
        email: validationResult.data.email || null,
        phone: validationResult.data.phone || null,
        address: validationResult.data.address || null,
        isActive: validationResult.data.isActive,
      },
    });

    // Log the creation activity
    await db.activityLog.create({
      data: {
        action: "CREATE",
        entityType: "ParkingService",
        entityId: parkingService.id,
        details: `Created parking service: ${parkingService.name}`,
        userId: session.user.id,
        severity: "INFO",
      },
    });

    return NextResponse.json(parkingService, { status: 201 });
  } catch (error) {
    console.error("Error creating parking service:", error);
    return NextResponse.json(
      { error: "Failed to create parking service" },
      { status: 500 }
    );
  }
}