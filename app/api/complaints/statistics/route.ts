// /app/api/complaints/statistics/route.ts
import { connection } from 'next/server';
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { ComplaintStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  await connection();

  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });
    
    if (!["ADMIN", "MANAGER"].includes(user?.role || "")) {
      return new NextResponse("Not authorized to view statistics", { status: 403 });
    }

    const searchParams = new URL(req.url).searchParams;
    const period = searchParams.get("period") || "month";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    
    let dateFilter: any = {};
    
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      };
    } else {
      const now = new Date();
      let periodStart = new Date();
      
      switch (period) {
        case "day":   periodStart.setDate(now.getDate() - 1); break;
        case "week":  periodStart.setDate(now.getDate() - 7); break;
        case "month": periodStart.setMonth(now.getMonth() - 1); break;
        case "year":  periodStart.setFullYear(now.getFullYear() - 1); break;
        case "all":   dateFilter = {}; break;
        default:      periodStart.setMonth(now.getMonth() - 1);
      }
      
      if (period !== "all") {
        dateFilter = { createdAt: { gte: periodStart, lte: now } };
      }
    }

    const totalComplaints = await db.complaint.count({ where: dateFilter });

    const complaintsByStatus = await db.complaint.groupBy({
      by: ["status"],
      where: dateFilter,
      _count: true,
    });

    const statusCounts = Object.values(ComplaintStatus).reduce((acc, status) => {
      const found = complaintsByStatus.find(s => s.status === status);
      acc[status] = found ? found._count : 0;
      return acc;
    }, {} as Record<string, number>);

    const complaintsByPriority = await db.complaint.groupBy({
      by: ["priority"],
      where: dateFilter,
      _count: true,
    });

    const complaintsByService = await db.complaint.groupBy({
      by: ["serviceId"],
      where: { ...dateFilter, serviceId: { not: null } },
      _count: true,
    });

    const serviceIds = complaintsByService.map(item => item.serviceId as string);
    const services = await db.service.findMany({
      where: { id: { in: serviceIds } },
      select: { id: true, name: true },
    });

    const serviceData = complaintsByService.map(item => ({
      serviceId: item.serviceId,
      count: item._count,
      name: services.find(s => s.id === item.serviceId)?.name || "Unknown",
    }));

    const complaintsByProvider = await db.complaint.groupBy({
      by: ["providerId"],
      where: { ...dateFilter, providerId: { not: null } },
      _count: true,
    });

    const providerIds = complaintsByProvider.map(item => item.providerId as string);
    const providers = await db.provider.findMany({
      where: { id: { in: providerIds } },
      select: { id: true, name: true },
    });

    const providerData = complaintsByProvider.map(item => ({
      providerId: item.providerId,
      count: item._count,
      name: providers.find(p => p.id === item.providerId)?.name || "Unknown",
    }));

    const resolvedComplaints = await db.complaint.findMany({
      where: { ...dateFilter, status: "RESOLVED", resolvedAt: { not: null } },
      select: { createdAt: true, resolvedAt: true },
    });

    let avgResolutionTime = 0;
    if (resolvedComplaints.length > 0) {
      const totalResolutionTime = resolvedComplaints.reduce((total, complaint) => {
        return total + (new Date(complaint.resolvedAt!).getTime() - new Date(complaint.createdAt).getTime());
      }, 0);
      avgResolutionTime = totalResolutionTime / resolvedComplaints.length / (1000 * 60 * 60);
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const complaintsLast30Days = await db.complaint.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const trendData = complaintsLast30Days.reduce((acc, complaint) => {
      const date = new Date(complaint.createdAt).toISOString().split("T")[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const trendSeries = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      trendSeries.unshift({ date: dateStr, count: trendData[dateStr] || 0 });
    }

    const financialImpactStats = await db.complaint.aggregate({
      where: { ...dateFilter, financialImpact: { not: null } },
      _sum: { financialImpact: true },
      _avg: { financialImpact: true },
      _max: { financialImpact: true },
    });

    return NextResponse.json({
      totalComplaints,
      byStatus: statusCounts,
      byPriority: complaintsByPriority,
      byService: serviceData,
      byProvider: providerData,
      avgResolutionTime,
      trendData: trendSeries,
      financialImpact: {
        total: financialImpactStats._sum.financialImpact || 0,
        average: financialImpactStats._avg.financialImpact || 0,
        max: financialImpactStats._max.financialImpact || 0,
      },
    });

  } catch (error) {
    console.error("[STATISTICS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}