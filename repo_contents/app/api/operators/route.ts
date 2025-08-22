// app/api/operators/route.ts


import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { validateOperator } from "@/lib/operators/validators";

export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Get query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const name = url.searchParams.get("name") || undefined;
    const code = url.searchParams.get("code") || undefined;
    const active = url.searchParams.get("active") !== null 
      ? url.searchParams.get("active") === "true"
      : undefined;
    const sort = url.searchParams.get("sort") || "name";
    const order = url.searchParams.get("order") || "asc";
    
    // Define where clause for filtering
    const where: any = {};
    
    if (name) {
      where.name = {
        contains: name,
        mode: "insensitive"
      };
    }
    
    if (code) {
      where.code = {
        contains: code,
        mode: "insensitive"
      };
    }
    
    if (active !== undefined) {
      where.active = active;
    }
    
    // Calculate skip for pagination
    const skip = (page - 1) * limit;
    
    // Get operators with pagination
    const operators = await db.operator.findMany({
      where,
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        logoUrl: true,
        website: true,
        contactEmail: true,
        contactPhone: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            contracts: true
          }
        }
      },
      orderBy: {
        [sort]: order
      },
      skip,
      take: limit
    });
    
    // Get total count for pagination
    const totalCount = await db.operator.count({ where });
    
    return NextResponse.json({
      data: operators,
      meta: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    });
    
  } catch (error) {
    console.error("Error fetching operators:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const body = await request.json();
    
    // Validate the request body
    const validationResult = validateOperator(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    // Check if operator with the same code already exists
    const existingOperator = await db.operator.findUnique({
      where: { code: body.code },
    });
    
    if (existingOperator) {
      return NextResponse.json(
        { error: "An operator with this code already exists" },
        { status: 409 }
      );
    }
    
    // Create the operator
    const operator = await db.operator.create({
      data: {
        name: body.name,
        code: body.code,
        description: body.description,
        logoUrl: body.logoUrl,
        website: body.website,
        contactEmail: body.contactEmail,
        contactPhone: body.contactPhone,
        active: body.active ?? true
      }
    });
    
    return NextResponse.json({ data: operator }, { status: 201 });
    
  } catch (error) {
    console.error("Error creating operator:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}