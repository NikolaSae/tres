// Path: app/api/security/performance/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { z } from "zod";
import { subHours, subDays, subWeeks, subMonths } from "date-fns";
// Uklonjen import za rateLimit jer se ne koristi Redis
// import { rateLimit } from "@/lib/security/rate-limiter";
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
  try {
    // Uklonjen sav kod za rate limiting jer se ne koristi Redis
    // const identifier = req.ip || "anonymous";
    // const rateLimited = await rateLimit(req, `performance-metrics-api-${identifier}`, { maxRequests: 30, window: 60 });
    // if (!rateLimited.success) {
    //   return NextResponse.json(
    //     { error: "Previše zahteva. Pokušajte ponovo kasnije." },
    //     { status: 429 }
    //   );
    // }

    const session = await auth();
    if (!session?.user) {
       // Logovanje neautorizovanog pristupa
       await db.activityLog.create({ data: { action: "UNAUTHORIZED_PERF_API", entityType: "PERFORMANCE", details: "Attempted access without auth", severity: "WARNING", userId: 'anonymous' as any } as any });
      return NextResponse.json({ error: "Neautorizovano" }, { status: 401 });
    }

    const userRole = session.user.role as UserRole;
    if (userRole !== "ADMIN" && userRole !== "MANAGER") {
       // Logovanje pristupa sa nedovoljnim privilegijama
       await db.activityLog.create({ data: { action: "UNAUTHORIZED_PERF_API", entityType: "PERFORMANCE", details: "Attempted access with insufficient role", severity: "WARNING", userId: session.user.id } as any });
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

    // Dohvatanje relevantnih logova aktivnosti
    const relevantLogs = await db.activityLog.findMany({
      where: {
        createdAt: { gte: startDate },
        details: { not: null }, // Filtrirajte logove koji imaju popunjeno polje details
        // Opciono: Dodajte dodatne filtere ako želite samo specifične akcije (npr. API pozive)
        // action: { startsWith: 'API_' }
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true, createdAt: true, details: true }, // Selektujte samo potrebna polja
    });

    // Parsiranje detalja logova i kreiranje PerformanceDataPoint objekata
    const performanceDataPoints: PerformanceDataPoint[] = relevantLogs
        .map(log => {
            try {
                // Pokušajte da parsirate JSON string iz details polja
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
                // Logovanje greške pri parsiranju
                console.error(`Failed to parse details for log ${log.id || 'unknown'}:`, log.details, parseError);
                return null; // Vratite null za logove koje ne možete da parsirate
            }
        })
        .filter(point => point !== null) as PerformanceDataPoint[]; // Filtrirajte null vrednosti

    // Logovanje uspešnog pristupa API-ju
    await db.activityLog.create({
      data: {
        action: "PERFORMANCE_METRICS_API_ACCESS",
        entityType: "PERFORMANCE_METRICS",
        details: `Korisnik dohvatio ${performanceDataPoints.length} tačaka za ${timeRange} opseg`,
        severity: "INFO",
        userId: session.user.id,
      } as any, // Potrebno castovanje zbog generisanih tipova
    });

    // Vraćanje dohvatanih podataka
    return NextResponse.json(performanceDataPoints);

  } catch (error) {
    console.error("Greška pri dohvatanju metrika performansi preko API-ja (iz logova):", error);
     // Logovanje greške pri pristupu API-ju
     await db.activityLog.create({ data: { action: "PERFORMANCE_METRICS_API_ERROR", entityType: "PERFORMANCE", details: `API Greška: ${(error as Error).message}`, severity: "ERROR", userId: (await auth())?.user?.id || 'anonymous' as any } as any});

    // Rukovanje Zod validacionim greškama
    if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Nevalidan 'timeRange' parameter", details: error.errors },
          { status: 400 }
        );
    }

    // Rukovanje ostalim greškama
    return NextResponse.json(
      { error: "Došlo je do greške pri dohvatanju metrika performansi" },
      { status: 500 }
    );
  }
}
