// Path: app/api/security/logs/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { LogSeverity } from "@prisma/client";
import { z } from "zod";

const createLogSchema = z.object({
  action: z.string().min(1, "Action is required"),
  entityType: z.string().min(1, "Entity type is required"),
  entityId: z.string().optional().nullable(),
  details: z.string().optional().nullable(),
  severity: z.enum(["INFO", "WARNING", "ERROR", "CRITICAL"]).default("INFO"),
});


// Ažurirana Zod schema za logs filtering sa userName
const logsFilterSchema = z.object({
  action: z.string().nullable().optional(),
  entityType: z.string().nullable().optional(),
  entityId: z.string().nullable().optional(),
  userId: z.string().nullable().optional(),
  userName: z.string().nullable().optional(), // Dodajemo userName u Zod šemu
  severity: z.enum(["INFO", "WARNING", "ERROR", "CRITICAL"]).nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(request.url);
    const filterParams = {
      action: url.searchParams.get("action"),
      entityType: url.searchParams.get("entityType"),
      entityId: url.searchParams.get("entityId"),
      userId: url.searchParams.get("userId"),
      userName: url.searchParams.get("userName"), // Dohvatamo userName iz query params
      severity: url.searchParams.get("severity"),
      startDate: url.searchParams.get("startDate"),
      endDate: url.searchParams.get("endDate"),
      page: url.searchParams.get("page"),
      limit: url.searchParams.get("limit"),
    };

    console.log("Received filterParams before Zod parse:", filterParams);

    const validatedParams = logsFilterSchema.parse(filterParams);

    console.log("Validated params after Zod parse:", validatedParams);


    const whereConditions: any = {};

    if (validatedParams.action) {
      whereConditions.action = validatedParams.action;
    }

    if (validatedParams.entityType) {
       whereConditions.entityType = validatedParams.entityType;
    }


    if (validatedParams.entityId) {
      if (validatedParams.entityId === "NULL") {
        whereConditions.entityId = null;
      } else {
        whereConditions.entityId = validatedParams.entityId;
      }
    }

    if (validatedParams.userId) {
      whereConditions.userId = validatedParams.userId;
    }

    // Dodajemo filter po imenu korisnika
    if (validatedParams.userName) {
      whereConditions.user = { // Filtriramo na povezanom 'user' modelu
        name: {
          contains: validatedParams.userName, // Koristimo 'contains' za delimično podudaranje
          mode: 'insensitive', // Dodajemo 'insensitive' za pretragu bez obzira na velika/mala slova (zahteva podršku baze)
        },
      };
    }


    if (validatedParams.severity) {
      whereConditions.severity = validatedParams.severity;
    }

    if (validatedParams.startDate || validatedParams.endDate) {
      whereConditions.createdAt = {};

      if (validatedParams.startDate) {
        whereConditions.createdAt.gte = new Date(validatedParams.startDate);
      }

      if (validatedParams.endDate) {
        whereConditions.createdAt.lte = new Date(validatedParams.endDate);
      }
    }

    const skip = (validatedParams.page - 1) * validatedParams.limit;

    const [logs, total] = await Promise.all([
      db.activityLog.findMany({
        where: whereConditions,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: validatedParams.limit,
      }),
      db.activityLog.count({
        where: whereConditions,
      }),
    ]);

    const totalPages = Math.ceil(total / validatedParams.limit);

    return NextResponse.json({
      logs,
      pagination: {
        total,
        page: validatedParams.page,
        limit: validatedParams.limit,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error retrieving security logs:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request parameters", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to retrieve security logs" },
      { status: 500 }
    );
  }
}

// Ostavite POST i DELETE funkcije neizmenjene
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const validatedData = createLogSchema.parse(body);

    const log = await db.activityLog.create({
      data: {
        action: validatedData.action,
        entityType: validatedData.entityType,
        entityId: validatedData.entityId,
        details: validatedData.details,
        severity: validatedData.severity as LogSeverity,
        userId: session.user.id,
      },
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error("Error creating security log:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create security log" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const olderThan = url.searchParams.get("olderThan");

    if (!olderThan) {
      return NextResponse.json(
        { error: "Missing olderThan parameter" },
        { status: 400 }
      );
    }

    const olderThanDate = new Date(olderThan);

    if (isNaN(olderThanDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format for olderThan" },
        { status: 400 }
      );
    }

    const result = await db.activityLog.deleteMany({
      where: {
        createdAt: {
          lt: olderThanDate,
        },
      },
    });

    await db.activityLog.create({
      data: {
        action: "PURGE_LOGS",
        entityType: "ACTIVITY_LOG",
        details: `Deleted ${result.count} logs older than ${olderThanDate.toISOString()}`,
        severity: "WARNING",
        userId: session.user.id,
      },
    });


    return NextResponse.json({
      message: `Successfully deleted ${result.count} log entries`,
      count: result.count,
    });
  } catch (error) {
    console.error("Error deleting logs:", error);
    return NextResponse.json(
      { error: "Failed to delete logs" },
      { status: 500 }
    );
  }
}