// Path: app/api/security/performance/summary/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { z } from "zod";
import { subHours, subDays, subWeeks, subMonths } from "date-fns";
import { rateLimiter } from "@/lib/security/rate-limiter";
import { UserRole } from "@prisma/client";

interface PerformanceSummary {
  totalRequests: number;
  avgResponseTime: number | null;
  errorRate: number | null;
  avgCpuUsage: number | null;
  avgMemoryUsage: number | null;
}

const timeRangeSchema = z.enum(["1h", "6h", "24h", "7d", "30d", "all"]).default("24h");

export async function GET(req: NextRequest) {
  try {
    const identifier = req.ip || "anonymous";
    const rateLimited = await rateLimiter(`performance-summary-api-${identifier}`, 30, 60);

    if (rateLimited) {
      return NextResponse.json(
        { error: "Previše zahteva. Pokušajte ponovo kasnije." },
        { status: 429 }
      );
    }

    const session = await auth();
    if (!session?.user) {
       await db.activityLog.create({ data: { action: "UNAUTHORIZED_PERF_SUMMARY_API", entityType: "PERFORMANCE", details: "Attempted access without auth", severity: "WARNING", userId: 'anonymous' as any } as any });
      return NextResponse.json({ error: "Neautorizovano" }, { status: 401 });
    }

    const userRole = session.user.role as UserRole;
    if (userRole !== "ADMIN" && userRole !== "MANAGER") {
       await db.activityLog.create({ data: { action: "UNAUTHORIZED_PERF_SUMMARY_API", entityType: "PERFORMANCE", details: "Attempted access with insufficient role", severity: "WARNING", userId: session.user.id } as any });
      return NextResponse.json({ error: "Zabranjeno" }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const timeRange = timeRangeSchema.parse(searchParams.get("timeRange") || undefined);

    let startDate: Date;
    const now = new Date();

    switch (timeRange) {
      case "1h": startDate = subHours(now, 1); break;
      case "6h": startDate = subHours(now, 6); break;
      case "24h": startDate = subHours(now, 24); break;
      case "7d": startDate = subDays(now, 7); break;
      case "30d": startDate = subDays(now, 30); break;
      case "all": startDate = new Date(0); break;
      default: startDate = subHours(now, 24); break;
    }

    const relevantLogs = await db.activityLog.findMany({
      where: {
        createdAt: { gte: startDate },
        details: { not: null },
      },
      select: { id: true, details: true },
    });

    let totalRequests = 0;
    let totalResponseTimeSum = 0;
    let countResponseTimeLogs = 0;
    let totalErrorsCalculated = 0;
    let totalRequestsForErrorRate = 0;
    let totalCpuUsageSum = 0;
    let countCpuLogs = 0;
    let totalMemoryUsageSum = 0;
    let countMemoryLogs = 0;

    relevantLogs.forEach(log => {
         try {
                const parsedDetails = log.details ? JSON.parse(log.details) : {};

                if (typeof parsedDetails.responseTime === 'number') {
                     totalResponseTimeSum += parsedDetails.responseTime;
                     countResponseTimeLogs++;
                }
                if (typeof parsedDetails.requestCount === 'number') {
                     totalRequests += parsedDetails.requestCount;
                     totalRequestsForErrorRate += parsedDetails.requestCount;
                }
                if (typeof parsedDetails.errorRate === 'number' && typeof parsedDetails.requestCount === 'number') {
                     totalErrorsCalculated += parsedDetails.requestCount * (parsedDetails.errorRate / 100);
                }
                 if (typeof parsedDetails.cpuUsage === 'number') {
                     totalCpuUsageSum += parsedDetails.cpuUsage;
                     countCpuLogs++;
                 }
                 if (typeof parsedDetails.memoryUsage === 'number') {
                     totalMemoryUsageSum += parsedDetails.memoryUsage;
                     countMemoryLogs++;
                 }
            } catch (parseError) {
                console.error(`Failed to parse details for log ${log.id || 'unknown'}:`, log.details, parseError);
            }
    });

    const avgResponseTime = countResponseTimeLogs > 0 ? totalResponseTimeSum / countResponseTimeLogs : null;
    const errorRate = totalRequestsForErrorRate > 0 ? (totalErrorsCalculated / totalRequestsForErrorRate) * 100 : null;
    const avgCpuUsage = countCpuLogs > 0 ? totalCpuUsageSum / countCpuLogs : null;
    const avgMemoryUsage = countMemoryLogs > 0 ? totalMemoryUsageSum / countMemoryLogs : null;

    const summary: PerformanceSummary = {
      totalRequests: totalRequests,
      avgResponseTime: avgResponseTime,
      errorRate: errorRate,
      avgCpuUsage: avgCpuUsage,
      avgMemoryUsage: avgMemoryUsage,
    };

    await db.activityLog.create({
      data: {
        action: "PERFORMANCE_SUMMARY_API_ACCESS",
        entityType: "PERFORMANCE_METRICS",
        details: `Korisnik dohvatio sumarne metrike za ${timeRange} opseg`,
        severity: "INFO",
        userId: session.user.id,
      } as any,
    });

    return NextResponse.json(summary);

  } catch (error) {
    console.error("Greška pri dohvatanju sumarnih metrika performansi (iz logova):", error);
     await db.activityLog.create({ data: { action: "PERFORMANCE_SUMMARY_API_ERROR", entityType: "PERFORMANCE", details: `Summary API Greška: ${(error as Error).message}`, severity: "ERROR", userId: (await auth())?.user?.id || 'anonymous' as any } as any});

    if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Nevalidan 'timeRange' parameter", details: error.errors },
          { status: 400 }
        );
    }

    return NextResponse.json(
      { error: "Došlo je do greške pri dohvatanju sumarnih metrika performansi" },
      { status: 500 }
    );
  }
}