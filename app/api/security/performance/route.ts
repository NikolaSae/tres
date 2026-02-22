// Path: app/api/security/performance/route.ts
import { connection } from 'next/server';
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { z } from "zod";
import { subHours, subDays } from "date-fns";
import { UserRole } from "@prisma/client";

interface PerformanceDataPoint {
  timestamp: Date;
  responseTime: number;
  requestCount: number;
  errorRate: number;
  cpuUsage: number | null;
  memoryUsage: number | null;
}

const timeRangeSchema = z.enum(["1h", "6h", "24h", "7d", "30d", "all"]).default("24h");

export async function GET(req: NextRequest) {
  await connection();

  try {
    const session = await auth();
    if (!session?.user) {
      await db.activityLog.create({
        data: {
          action: "UNAUTHORIZED_PERF_API",
          entityType: "PERFORMANCE",
          details: "Attempted access without auth",
          severity: "WARNING",
          userId: 'anonymous' as any
        } as any
      });
      return NextResponse.json({ error: "Neautorizovano" }, { status: 401 });
    }

    const userRole = session.user.role as UserRole;
    if (userRole !== "ADMIN" && userRole !== "MANAGER") {
      await db.activityLog.create({
        data: {
          action: "UNAUTHORIZED_PERF_API",
          entityType: "PERFORMANCE",
          details: "Attempted access with insufficient role",
          severity: "WARNING",
          userId: session.user.id
        } as any
      });
      return NextResponse.json({ error: "Zabranjeno" }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const timeRange = timeRangeSchema.parse(searchParams.get("timeRange") || undefined);

    let startDate: Date;
    const now = new Date();

    switch (timeRange) {
      case "1h":  startDate = subHours(now, 1); break;
      case "6h":  startDate = subHours(now, 6); break;
      case "24h": startDate = subHours(now, 24); break;
      case "7d":  startDate = subDays(now, 7); break;
      case "30d": startDate = subDays(now, 30); break;
      case "all": startDate = new Date(0); break;
      default:    startDate = subHours(now, 24); break;
    }

    const relevantLogs = await db.activityLog.findMany({
      where: {
        createdAt: { gte: startDate },
        details: { not: null },
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true, createdAt: true, details: true },
    });

    const performanceDataPoints: PerformanceDataPoint[] = relevantLogs
      .map(log => {
        try {
          const parsedDetails = log.details ? JSON.parse(log.details) : {};
          return {
            timestamp: log.createdAt,
            responseTime: typeof parsedDetails.responseTime === 'number' ? parsedDetails.responseTime : 0,
            requestCount: typeof parsedDetails.requestCount === 'number' ? parsedDetails.requestCount : 0,
            errorRate: typeof parsedDetails.errorRate === 'number' ? parsedDetails.errorRate : 0,
            cpuUsage: typeof parsedDetails.cpuUsage === 'number' ? parsedDetails.cpuUsage : null,
            memoryUsage: typeof parsedDetails.memoryUsage === 'number' ? parsedDetails.memoryUsage : null,
          };
        } catch (parseError) {
          console.error(`Failed to parse details for log ${log.id || 'unknown'}:`, parseError);
          return null;
        }
      })
      .filter(point => point !== null) as PerformanceDataPoint[];

    await db.activityLog.create({
      data: {
        action: "PERFORMANCE_METRICS_API_ACCESS",
        entityType: "PERFORMANCE_METRICS",
        details: `Korisnik dohvatio ${performanceDataPoints.length} tačaka za ${timeRange} opseg`,
        severity: "INFO",
        userId: session.user.id,
      } as any,
    });

    return NextResponse.json(performanceDataPoints);

  } catch (error) {
    console.error("Greška pri dohvatanju metrika performansi:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Nevalidan 'timeRange' parameter", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Došlo je do greške pri dohvatanju metrika performansi" },
      { status: 500 }
    );
  }
}