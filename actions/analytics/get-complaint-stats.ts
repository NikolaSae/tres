///actions/analytics/get-complaint-stats.ts
"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { canViewComplaintData } from "@/lib/security/permission-checker";
import { ComplaintStatus } from "@prisma/client";

export type ComplaintStatsParams = {
  startDate?: Date;
  endDate?: Date;
  serviceIds?: string[];
  providerIds?: string[];
  statuses?: ComplaintStatus[];
  priorities?: number[];
  searchQuery?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export type ComplaintStats = {
  totalComplaints: number;
  resolvedComplaints: number;
  openComplaints: number;
  averageResolutionTime: number;
  complaintsByStatus: { status: string; count: number; percentage: number }[];
  complaintsByMonth: { month: string; total: number; resolved: number }[];
  complaintsByService: { serviceName: string; count: number; percentage: number }[];
  complaintsByProvider: {
    providerName: string;
    count: number;
    resolvedCount: number;
    averageResolutionTime: number;
  }[];
  highPriorityComplaints: number;
  financialImpact: number;
};

export async function getComplaintStats({
  startDate,
  endDate,
  serviceIds,
  providerIds,
  statuses,
  priorities,
  searchQuery,
  sortBy,
  sortOrder,
}: ComplaintStatsParams = {}): Promise<ComplaintStats> {

  // ✅ Explicit auth check
  const session = await auth();
  if (!session?.user) throw new Error("Authentication required");

  const hasPermission = await canViewComplaintData();
  if (!hasPermission) throw new Error("You don't have permission to access complaint data");

  const defaultEndDate = new Date();
  const defaultStartDate = new Date();
  defaultStartDate.setFullYear(defaultStartDate.getFullYear() - 1);

  const effectiveStartDate = startDate || defaultStartDate;
  const effectiveEndDate = endDate || defaultEndDate;
  effectiveStartDate.setHours(0, 0, 0, 0);
  effectiveEndDate.setHours(23, 59, 59, 999);

  const where: Record<string, unknown> = {
    createdAt: { gte: effectiveStartDate, lte: effectiveEndDate },
  };

  if (serviceIds?.length) where.serviceId = { in: serviceIds };
  if (providerIds?.length) where.providerId = { in: providerIds };
  if (statuses?.length) where.status = { in: statuses };
  if (priorities?.length) where.priority = { in: priorities };
  if (searchQuery) {
    where.OR = [
      { subject: { contains: searchQuery, mode: "insensitive" } },
      { description: { contains: searchQuery, mode: "insensitive" } },
    ];
  }

  // ✅ UKLONJEN: console.log("Final WHERE clause...", JSON.stringify(where))
  // Otkrivao strukturu baze i vrednosti filtera u produkcijskim logovima

  const VALID_SORT_FIELDS: Record<string, string> = {
    date: "createdAt",
    status: "status",
    priority: "priority",
  };

  // ✅ UKLONJEN: console.warn za unknown sortBy
  const prismaSortField = (sortBy && VALID_SORT_FIELDS[sortBy]) || "createdAt";
  const orderBy = { [prismaSortField]: sortOrder || "asc" };

  const complaints = await db.complaint.findMany({
    where,
    include: { service: true, provider: true },
    orderBy,
  });

  const totalComplaints = complaints.length;
  const resolvedComplaints = complaints.filter(
    (c) => c.status === ComplaintStatus.RESOLVED || c.status === ComplaintStatus.CLOSED
  ).length;
  const openComplaints = totalComplaints - resolvedComplaints;

  const resolvedWithDates = complaints.filter(
    (c) =>
      (c.status === ComplaintStatus.RESOLVED || c.status === ComplaintStatus.CLOSED) &&
      c.resolvedAt
  );

  const totalResolutionTimeMs = resolvedWithDates.reduce((sum, c) => {
    const created = new Date(c.createdAt).getTime();
    const resolved = new Date(c.resolvedAt!).getTime();
    return sum + (resolved - created);
  }, 0);

  const averageResolutionTime =
    resolvedWithDates.length > 0
      ? totalResolutionTimeMs / resolvedWithDates.length / (1000 * 60 * 60 * 24)
      : 0;

  const statusCounts = complaints.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const monthlyData = complaints.reduce((acc, c) => {
    const monthYear = new Date(c.createdAt).toLocaleString("en-US", { month: "short", year: "2-digit" });
    if (!acc[monthYear]) acc[monthYear] = { total: 0, resolved: 0 };
    acc[monthYear].total++;
    if (c.status === ComplaintStatus.RESOLVED || c.status === ComplaintStatus.CLOSED) {
      acc[monthYear].resolved++;
    }
    return acc;
  }, {} as Record<string, { total: number; resolved: number }>);

  const fullMonthRange: Record<string, { total: number; resolved: number }> = {};
  const cur = new Date(effectiveStartDate);
  while (cur <= effectiveEndDate) {
    const key = cur.toLocaleString("en-US", { month: "short", year: "2-digit" });
    fullMonthRange[key] = monthlyData[key] || { total: 0, resolved: 0 };
    cur.setMonth(cur.getMonth() + 1);
  }

  const complaintsByMonth = Object.entries(fullMonthRange)
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => {
      const [am, ay] = a.month.split(" ");
      const [bm, by] = b.month.split(" ");
      return new Date(`${am} 01 20${ay}`).getTime() - new Date(`${bm} 01 20${by}`).getTime();
    });

  const serviceData = complaints.reduce((acc, c) => {
    const name = c.service?.name || "Unknown";
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const providerData = complaints.reduce(
    (acc, c) => {
      const name = c.provider?.name || "Unknown";
      if (!acc[name]) acc[name] = { count: 0, resolvedCount: 0, totalResolutionTime: 0 };
      acc[name].count++;
      if (
        (c.status === ComplaintStatus.RESOLVED || c.status === ComplaintStatus.CLOSED) &&
        c.resolvedAt
      ) {
        acc[name].resolvedCount++;
        acc[name].totalResolutionTime +=
          new Date(c.resolvedAt).getTime() - new Date(c.createdAt).getTime();
      }
      return acc;
    },
    {} as Record<string, { count: number; resolvedCount: number; totalResolutionTime: number }>
  );

  const highPriorityComplaints = complaints.filter((c) => c.priority <= 2).length;
  const financialImpact = complaints.reduce((sum, c) => sum + (c.financialImpact || 0), 0);

  return {
    totalComplaints,
    resolvedComplaints,
    openComplaints,
    averageResolutionTime,
    complaintsByStatus: Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: totalComplaints > 0 ? (count / totalComplaints) * 100 : 0,
    })),
    complaintsByMonth,
    complaintsByService: Object.entries(serviceData)
      .map(([serviceName, count]) => ({
        serviceName,
        count,
        percentage: totalComplaints > 0 ? (count / totalComplaints) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count),
    complaintsByProvider: Object.entries(providerData)
      .map(([providerName, data]) => ({
        providerName,
        count: data.count,
        resolvedCount: data.resolvedCount,
        averageResolutionTime:
          data.resolvedCount > 0
            ? data.totalResolutionTime / data.resolvedCount / (1000 * 60 * 60 * 24)
            : 0,
      }))
      .sort((a, b) => b.count - a.count),
    highPriorityComplaints,
    financialImpact,
  };
}