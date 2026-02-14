// app/api/complaints/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { ComplaintSchema } from "@/schemas/complaint";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    // FIX: Dodaj proveru za session.user.id
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Filters
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const serviceId = searchParams.get("serviceId");
    const providerId = searchParams.get("providerId");
    const assignedAgentId = searchParams.get("assignedAgentId");
    const search = searchParams.get("search");

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = parseInt(priority);
    }

    if (serviceId) {
      where.serviceId = serviceId;
    }

    if (providerId) {
      where.providerId = providerId;
    }

    if (assignedAgentId) {
      where.assignedAgentId = assignedAgentId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // For non-admin users, filter to show only their complaints or assigned complaints
    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
      where.OR = [
        { submittedById: session.user.id },
        { assignedAgentId: session.user.id },
      ];
    }

    const [complaints, totalCount] = await Promise.all([
      db.complaint.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          submittedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          assignedAgent: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          provider: {
            select: {
              id: true,
              name: true,
            },
          },
          humanitarianOrg: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        skip,
        take: limit,
      }),
      db.complaint.count({ where }),
    ]);

    return NextResponse.json({
      complaints,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error("Error fetching complaints:", error);
    return NextResponse.json(
      { error: "Failed to fetch complaints" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    // FIX: Dodaj proveru za session.user.id
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();

    const validatedData = ComplaintSchema.parse(json);

    // session.user.id is now guaranteed to be string
    const complaint = await db.complaint.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        priority: validatedData.priority,
        serviceId: validatedData.serviceId || null,
        providerId: validatedData.providerId || null,
        financialImpact: validatedData.financialImpact || null,
        submittedById: session.user.id, // ✅ Now type-safe
        status: "NEW",
      },
      include: {
        submittedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
          },
        },
        provider: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Log activity - session.user.id is now guaranteed to be string
    await db.activityLog.create({
      data: {
        action: "CREATE_COMPLAINT",
        entityType: "complaint",
        entityId: complaint.id,
        details: `Created complaint: ${complaint.title}`,
        severity: "INFO",
        userId: session.user.id, // ✅ Now type-safe
      },
    });

    return NextResponse.json(complaint, { status: 201 });
  } catch (error) {
    console.error("Error creating complaint:", error);
    return NextResponse.json(
      { error: "Failed to create complaint" },
      { status: 500 }
    );
  }
}