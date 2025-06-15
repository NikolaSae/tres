///actions/analytics/get-complaint-stats.ts

"use server";

import { db } from "@/lib/db";
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
  sortOrder?: 'asc' | 'desc';
};

export type ComplaintStats = {
  totalComplaints: number;
  resolvedComplaints: number;
  openComplaints: number;
  averageResolutionTime: number;
  complaintsByStatus: {
    status: string;
    count: number;
    percentage: number;
  }[];
  complaintsByMonth: {
    month: string;
    total: number;
    resolved: number;
  }[];
  complaintsByService: {
    serviceName: string;
    count: number;
    percentage: number;
  }[];
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

  const hasPermission = await canViewComplaintData();
  if (!hasPermission) {
    throw new Error("You don't have permission to access complaint data");
  }

  const defaultEndDate = new Date();
  const defaultStartDate = new Date();
  defaultStartDate.setFullYear(defaultStartDate.getFullYear() - 1);

  const effectiveStartDate = startDate || defaultStartDate;
  const effectiveEndDate = endDate || defaultEndDate;

  effectiveStartDate.setHours(0, 0, 0, 0);
  effectiveEndDate.setHours(23, 59, 59, 999);

  const where: any = {
    createdAt: {
      gte: effectiveStartDate,
      lte: effectiveEndDate,
    },
  };

  if (serviceIds && serviceIds.length > 0) {
    where.serviceId = { in: serviceIds };
  }

  if (providerIds && providerIds.length > 0) {
    where.providerId = { in: providerIds };
  }

  if (statuses && statuses.length > 0) {
    where.status = { in: statuses };
  }

  if (priorities && priorities.length > 0) {
    where.priority = { in: priorities };
  }

  if (searchQuery) {
    where.OR = [
      { subject: { contains: searchQuery, mode: 'insensitive' as const } },
      { description: { contains: searchQuery, mode: 'insensitive' as const } },
    ];
  }
console.log("Final WHERE clause for getComplaintStats:", JSON.stringify(where, null, 2)); // <-- Treba nam output ovog loga
  const orderBy: any = {};
  let prismaSortField = 'createdAt';

  if (sortBy) {
    switch (sortBy) {
      case 'date':
        prismaSortField = 'createdAt';
        break;
      case 'status':
        prismaSortField = 'status';
        break;
      case 'priority':
        prismaSortField = 'priority';
        break;
      default:
        prismaSortField = 'createdAt';
        console.warn(`Unknown sortBy field '${sortBy}'. Defaulting to 'createdAt'.`);
    }
  }

  orderBy[prismaSortField] = sortOrder || 'asc';


  const complaints = await db.complaint.findMany({
    where,
    include: {
      service: true,
      provider: true,
    },
    orderBy,
  });

  const totalComplaints = complaints.length;
  const resolvedComplaints = complaints.filter(c =>
    c.status === ComplaintStatus.RESOLVED || c.status === ComplaintStatus.CLOSED
  ).length;
  const openComplaints = totalComplaints - resolvedComplaints;

  const resolvedComplaintsWithDates = complaints.filter(c =>
    (c.status === ComplaintStatus.RESOLVED || c.status === ComplaintStatus.CLOSED) && c.resolvedAt
  );

  const totalResolutionTimeMs = resolvedComplaintsWithDates.reduce((sum, complaint) => {
    const createdAtTime = complaint.createdAt instanceof Date ? complaint.createdAt.getTime() : new Date(complaint.createdAt).getTime();
    const resolvedAtTime = complaint.resolvedAt instanceof Date ? complaint.resolvedAt.getTime() : new Date(complaint.resolvedAt!).getTime();
    return sum + (resolvedAtTime - createdAtTime);
  }, 0);

  const averageResolutionTime = resolvedComplaintsWithDates.length > 0
    ? totalResolutionTimeMs / resolvedComplaintsWithDates.length / (1000 * 60 * 60 * 24)
    : 0;

  const statusCounts = complaints.reduce((acc, complaint) => {
    const status = complaint.status;
    if (!acc[status]) { acc[status] = 0; }
    acc[status]++;
    return acc;
  }, {} as Record<string, number>);

  const monthlyData = complaints.reduce((acc, complaint) => {
    const createdAtDate = complaint.createdAt instanceof Date ? complaint.createdAt : new Date(complaint.createdAt);
    const monthYear = createdAtDate.toLocaleString('en-US', { month: 'short', year: '2-digit' });

    if (!acc[monthYear]) {
      acc[monthYear] = {
        total: 0,
        resolved: 0,
      };
    }

    acc[monthYear].total++;
    if (complaint.status === ComplaintStatus.RESOLVED || complaint.status === ComplaintStatus.CLOSED) {
      acc[monthYear].resolved++;
    }

    return acc;
  }, {} as Record<string, { total: number; resolved: number; }>);

  const fullMonthRangeData: Record<string, { total: number; resolved: number }> = {};
  let currentDate = new Date(effectiveStartDate);
  while (currentDate <= effectiveEndDate) {
    const monthYear = currentDate.toLocaleString('en-US', { month: 'short', year: '2-digit' });
    fullMonthRangeData[monthYear] = monthlyData[monthYear] || { total: 0, resolved: 0 };
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  const complaintsByMonth = Object.entries(fullMonthRangeData)
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => {
        const [aMonth, aYear] = a.month.split(' ');
        const [bMonth, bYear] = b.month.split(' ');
        const dateA = new Date(`${aMonth} 01 20${aYear}`);
        const dateB = new Date(`${bMonth} 01 20${bYear}`);
        return dateA.getTime() - dateB.getTime();
    });


  const serviceData = complaints.reduce((acc, complaint) => {
    const serviceName = complaint.service?.name || 'Unknown';
    if (!acc[serviceName]) { acc[serviceName] = 0; }
    acc[serviceName]++;
    return acc;
  }, {} as Record<string, number>);

  const providerData = complaints.reduce((acc, complaint) => {
    const providerName = complaint.provider?.name || 'Unknown';

    if (!acc[providerName]) {
      acc[providerName] = {
        count: 0,
        resolvedCount: 0,
        totalResolutionTime: 0,
      };
    }

    acc[providerName].count++;

    if ((complaint.status === ComplaintStatus.RESOLVED || complaint.status === ComplaintStatus.CLOSED) && complaint.resolvedAt) {
      const createdAtTime = complaint.createdAt instanceof Date ? complaint.createdAt.getTime() : new Date(complaint.createdAt).getTime();
      const resolvedAtTime = complaint.resolvedAt instanceof Date ? complaint.resolvedAt.getTime() : new Date(complaint.resolvedAt).getTime();
      acc[providerName].resolvedCount++;
      acc[providerName].totalResolutionTime += resolvedAtTime - createdAtTime;
    }

    return acc;
  }, {} as Record<string, { count: number; resolvedCount: number; totalResolutionTime: number; }>);


  const highPriorityComplaints = complaints.filter(c => c.priority <= 2).length;

  const financialImpact = complaints.reduce((sum, complaint) => {
    return sum + (complaint.financialImpact || 0);
  }, 0);

  const complaintsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
    percentage: totalComplaints > 0 ? (count / totalComplaints) * 100 : 0,
  }));

  const complaintsByService = Object.entries(serviceData)
    .map(([serviceName, count]) => ({
      serviceName,
      count,
      percentage: totalComplaints > 0 ? (count / totalComplaints) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const complaintsByProvider = Object.entries(providerData)
    .map(([providerName, data]) => ({
      providerName,
      count: data.count,
      resolvedCount: data.resolvedCount,
      averageResolutionTime: data.resolvedCount > 0
        ? data.totalResolutionTime / data.resolvedCount / (1000 * 60 * 60 * 24)
        : 0,
    }))
    .sort((a, b) => b.count - a.count);


  return {
    totalComplaints,
    resolvedComplaints,
    openComplaints,
    averageResolutionTime,
    complaintsByStatus,
    complaintsByMonth,
    complaintsByService,
    complaintsByProvider,
    highPriorityComplaints,
    financialImpact,
  };
}