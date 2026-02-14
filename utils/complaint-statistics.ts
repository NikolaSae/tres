// utils/complaint-statistics.ts
import { ComplaintWithRelations } from "@/lib/types/complaint-types";
import { Complaint } from "@prisma/client"; // ✅ Import Complaint from Prisma
import { ComplaintStatus, ServiceType } from "@/lib/types/enums";
import { format, differenceInDays, differenceInHours, isWithinInterval, subDays, subMonths } from "date-fns";

/**
 * Calculate resolution time for a complaint
 * @param complaint The complaint object
 * @returns Resolution time in days or null if not resolved
 */
export function calculateResolutionTime(complaint: Complaint): number | null {
  if (!complaint.resolvedAt) {
    return null;
  }

  const createdAt = new Date(complaint.createdAt);
  const resolvedAt = new Date(complaint.resolvedAt);

  // Proveravamo da li su datumi validni pre izračunavanja razlike
  if (isNaN(createdAt.getTime()) || isNaN(resolvedAt.getTime())) {
    console.error(`Invalid dates for complaint ${complaint.id}: createdAt=${complaint.createdAt}, resolvedAt=${complaint.resolvedAt}`);
    return null;
  }

  const diffDays = differenceInDays(resolvedAt, createdAt);
  const diffHours = differenceInHours(resolvedAt, createdAt) % 24;

  return diffDays + (diffHours / 24);
}

/**
 * Calculate average resolution time for multiple complaints
 * @param complaints Array of complaints
 * @returns Average resolution time in days
 */
export function calculateAverageResolutionTime(complaints: Complaint[]): number {
  const resolvedComplaints = complaints.filter(c => c.resolvedAt && !isNaN(new Date(c.resolvedAt).getTime()));

  if (resolvedComplaints.length === 0) {
    return 0;
  }

  const totalResolutionTime = resolvedComplaints.reduce((total, complaint) => {
    const resolutionTime = calculateResolutionTime(complaint);
    return total + (resolutionTime || 0);
  }, 0);

  return totalResolutionTime / resolvedComplaints.length;
}

/**
 * Calculate resolution rate for complaints
 * @param complaints Array of complaints
 * @returns Resolution rate as a percentage
 */
export function calculateResolutionRate(complaints: Complaint[]): number {
  if (complaints.length === 0) {
    return 0;
  }

  const resolvedCount = complaints.filter(c =>
    c.status === ComplaintStatus.RESOLVED || c.status === ComplaintStatus.CLOSED
  ).length;

  return (resolvedCount / complaints.length) * 100;
}

/**
 * Group complaints by status
 * @param complaints Array of complaints
 * @returns Object with counts by status
 */
export function groupComplaintsByStatus(complaints: Complaint[]): { [key in ComplaintStatus]: number } {
  const statusCounts: { [key in ComplaintStatus]: number } = { // ✅ Added explicit type
    [ComplaintStatus.NEW]: 0,
    [ComplaintStatus.ASSIGNED]: 0,
    [ComplaintStatus.IN_PROGRESS]: 0,
    [ComplaintStatus.PENDING]: 0,
    [ComplaintStatus.RESOLVED]: 0,
    [ComplaintStatus.CLOSED]: 0,
    [ComplaintStatus.REJECTED]: 0,
  };

  complaints.forEach(complaint => {
    if (Object.values(ComplaintStatus).includes(complaint.status)) {
      statusCounts[complaint.status]++;
    } else {
      console.warn(`Unknown complaint status encountered: ${complaint.status}`);
    }
  });

  return statusCounts;
}

/**
 * Group complaints by service type
 * @param complaints Array of complaints with relations
 * @returns Object with counts by service type
 */
export function groupComplaintsByServiceType(complaints: ComplaintWithRelations[]): { [key in ServiceType]?: number } {
  const serviceCounts: { [key in ServiceType]?: number } = {};

  complaints.forEach(complaint => {
    if (complaint.service?.type && Object.values(ServiceType).includes(complaint.service.type)) {
      const serviceType = complaint.service.type;
      serviceCounts[serviceType] = (serviceCounts[serviceType] || 0) + 1;
    } else if (complaint.service?.type) {
      console.warn(`Unknown service type encountered: ${complaint.service.type}`);
    }
  });

  return serviceCounts;
}

/**
 * Group complaints by provider
 * @param complaints Array of complaints with relations
 * @returns Array of provider stats
 */
export function groupComplaintsByProvider(complaints: ComplaintWithRelations[]): Array<{
  providerId: string;
  providerName: string;
  complaintCount: number;
  avgResolutionTime: number;
}> {
  const providerMap = new Map<string, {
    providerId: string;
    providerName: string;
    complaints: Complaint[];
  }>();

  // Group complaints by provider
  complaints.forEach(complaint => {
    if (complaint.provider) {
      const providerId = complaint.provider.id;
      const providerName = complaint.provider.name;

      if (!providerMap.has(providerId)) {
        providerMap.set(providerId, {
          providerId,
          providerName,
          complaints: [],
        });
      }

      providerMap.get(providerId)!.complaints.push(complaint);
    }
  });

  // Calculate statistics for each provider
  return Array.from(providerMap.values()).map(provider => {
    return {
      providerId: provider.providerId,
      providerName: provider.providerName,
      complaintCount: provider.complaints.length,
      avgResolutionTime: calculateAverageResolutionTime(provider.complaints),
    };
  }).sort((a, b) => b.complaintCount - a.complaintCount);
}

/**
 * Generate trend data for complaints over time
 * @param complaints Array of complaints
 * @param days Number of days to include in trend
 * @returns Array of data points for trending
 */
export function generateTrendData(complaints: Complaint[], days: number = 30): Array<{
  date: string;
  new: number;
  resolved: number;
  closed: number;
  total: number;
}> {
  const result = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const currentDate = subDays(now, i);
    const dateStr = format(currentDate, "MMM dd");

    const dayComplaints = complaints.filter(complaint => {
      const createdAt = new Date(complaint.createdAt);
      return !isNaN(createdAt.getTime()) && format(createdAt, "yyyy-MM-dd") === format(currentDate, "yyyy-MM-dd");
    });

    const resolvedOnDay = complaints.filter(complaint => {
      if (!complaint.resolvedAt) return false;
      const resolvedAt = new Date(complaint.resolvedAt);
      return !isNaN(resolvedAt.getTime()) && format(resolvedAt, "yyyy-MM-dd") === format(currentDate, "yyyy-MM-dd");
    });

    const closedOnDay = complaints.filter(complaint => {
      if (!complaint.closedAt) return false;
      const closedAt = new Date(complaint.closedAt);
      return !isNaN(closedAt.getTime()) && format(closedAt, "yyyy-MM-dd") === format(currentDate, "yyyy-MM-dd");
    });

    result.push({
      date: dateStr,
      new: dayComplaints.length,
      resolved: resolvedOnDay.length,
      closed: closedOnDay.length,
      total: complaints.filter(c => {
        const createdAt = new Date(c.createdAt);
        return !isNaN(createdAt.getTime()) && createdAt <= currentDate;
      }).length,
    });
  }

  return result;
}

/**
 * Generate monthly comparison data
 * @param complaints Array of complaints with relations
 * @param months Number of months to include
 * @returns Monthly comparison data
 */
export function generateMonthlyComparisonData(
  complaints: ComplaintWithRelations[],
  months: number = 6
): Array<{
  month: string;
  VAS: number;
  BULK: number;
  HUMANITARIAN: number;
  PARKING: number;
}> {
  const result = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const currentMonth = subMonths(now, i);
    const monthStr = format(currentMonth, "MMM");

    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const monthComplaints = complaints.filter(complaint => {
      const createdAt = new Date(complaint.createdAt);
      return !isNaN(createdAt.getTime()) && isWithinInterval(createdAt, { start: monthStart, end: monthEnd });
    });

    // ✅ Fixed type to allow indexing
    const serviceTypeCounts: Record<string, number> = {
      month: 0, // This will be overwritten with monthStr
      VAS: 0,
      BULK: 0,
      HUMANITARIAN: 0,
      PARKING: 0,
    };

    monthComplaints.forEach(complaint => {
      if (complaint.service?.type && Object.values(ServiceType).includes(complaint.service.type)) {
        const serviceType = complaint.service.type;
        if (serviceType in serviceTypeCounts) {
          serviceTypeCounts[serviceType] += 1;
        }
      }
    });

    result.push({
      month: monthStr,
      VAS: serviceTypeCounts.VAS,
      BULK: serviceTypeCounts.BULK,
      HUMANITARIAN: serviceTypeCounts.HUMANITARIAN,
      PARKING: serviceTypeCounts.PARKING,
    });
  }

  return result;
}

// ✅ Fixed: Added proper type annotations for anomaly type
type AnomalyType = "spike" | "unusual_resolution_time" | "high_rejection_rate";

/**
 * Generate anomaly detection data
 * @param complaints Array of complaints
 * @returns Any detected anomalies in the data
 */
export function detectAnomalies(complaints: Complaint[]): Array<{
  type: AnomalyType;
  value: number;
  threshold: number;
  description: string;
}> {
  const anomalies: Array<{
    type: AnomalyType;
    value: number;
    threshold: number;
    description: string;
  }> = []; // ✅ Added explicit type

  const now = new Date();
  
  // Check for spikes in complaint volume
  const last7Days = complaints.filter(c => {
    const createdAt = new Date(c.createdAt);
    return !isNaN(createdAt.getTime()) && isWithinInterval(createdAt, {
      start: subDays(now, 7),
      end: now,
    });
  }).length;

  const prev7Days = complaints.filter(c => {
    const createdAt = new Date(c.createdAt);
    return !isNaN(createdAt.getTime()) && isWithinInterval(createdAt, {
      start: subDays(now, 14),
      end: subDays(now, 7),
    });
  }).length;

  const percentChange = prev7Days > 0 ? ((last7Days - prev7Days) / prev7Days) * 100 : 0;

  if (percentChange > 50 && last7Days > 10) {
    anomalies.push({
      type: "spike" as AnomalyType, // ✅ Explicit type assertion
      value: percentChange,
      threshold: 50,
      description: `Complaints volume increased by ${percentChange.toFixed(1)}% in the last 7 days compared to previous 7 days`,
    });
  }

  // Check for unusual resolution times
  const resolvedComplaints = complaints.filter(c => c.resolvedAt);
  const avgResolutionTime = calculateAverageResolutionTime(resolvedComplaints);

  const recentlyResolved = resolvedComplaints.filter(c => {
    if (!c.resolvedAt) return false;
    const resolvedAt = new Date(c.resolvedAt);
    return !isNaN(resolvedAt.getTime()) && isWithinInterval(resolvedAt, {
      start: subDays(now, 7),
      end: now,
    });
  });

  const recentAvgResolutionTime = calculateAverageResolutionTime(recentlyResolved);

  if (recentAvgResolutionTime > avgResolutionTime * 1.5 && recentlyResolved.length > 5) {
    anomalies.push({
      type: "unusual_resolution_time" as AnomalyType, // ✅ Explicit type assertion
      value: recentAvgResolutionTime,
      threshold: avgResolutionTime * 1.5,
      description: `Recent average resolution time (${recentAvgResolutionTime.toFixed(1)} days) is significantly higher than overall average (${avgResolutionTime.toFixed(1)} days)`,
    });
  }

  // Check for high rejection rates
  const rejectedComplaints = complaints.filter(c => c.status === ComplaintStatus.REJECTED);
  const rejectionRate = complaints.length > 0 ? (rejectedComplaints.length / complaints.length) * 100 : 0;

  if (rejectionRate > 15) {
    anomalies.push({
      type: "high_rejection_rate" as AnomalyType, // ✅ Explicit type assertion
      value: rejectionRate,
      threshold: 15,
      description: `High complaint rejection rate of ${rejectionRate.toFixed(1)}% detected`,
    });
  }

  return anomalies;
}

export function calculateStatistics(complaints: Complaint[]): any {
  const statusCounts = groupComplaintsByStatus(complaints);
  const avgResTime = calculateAverageResolutionTime(complaints);
  const resRate = calculateResolutionRate(complaints);
  
  return {
    statusCounts,
    avgResTime,
    resRate,
  };
}