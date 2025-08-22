// utils/complaint-statistics.ts
// Uklonjene lokalne definicije tipova, oslanjamo se na uvoz
import { Complaint, ComplaintWithRelations } from "@/lib/types/complaint-types";
// Proverite putanju za ComplaintStatus i ServiceType ako nisu iz Prisma klijenta
import { ComplaintStatus, ServiceType } from "@/lib/types/enums"; // Pretpostavljamo da su enumi ovde
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
    return null; // Vraćamo null ili 0 za nevalidne datume
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
  // Filtriramo samo pritužbe sa validnim resolvedAt datumom
  const resolvedComplaints = complaints.filter(c => c.resolvedAt && !isNaN(new Date(c.resolvedAt).getTime()));

  if (resolvedComplaints.length === 0) {
    return 0;
  }

  const totalResolutionTime = resolvedComplaints.reduce((total, complaint) => {
    const resolutionTime = calculateResolutionTime(complaint);
    // Dodajemo samo validno izračunato vreme rezolucije
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
  const statusCounts = {
    [ComplaintStatus.NEW]: 0,
    [ComplaintStatus.ASSIGNED]: 0,
    [ComplaintStatus.IN_PROGRESS]: 0,
    [ComplaintStatus.PENDING]: 0,
    [ComplaintStatus.RESOLVED]: 0,
    [ComplaintStatus.CLOSED]: 0,
    [ComplaintStatus.REJECTED]: 0,
  };

  complaints.forEach(complaint => {
    // Dodata provera da li status postoji u enum-u pre pristupanja
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
    // Proveravamo da li service i service.type postoje i da li je tip validan ServiceType
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

      // Dodajemo samo Complaint deo objekta ako ComplaintWithRelations ima dodatne propertije
      // Ako je ComplaintWithRelations samo Complaint + relacije, ovo je OK
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
    // ISPRAVLJENO: Ispravljen format string
    const dateStr = format(currentDate, "MMM dd");

    const dayComplaints = complaints.filter(complaint => {
      const createdAt = new Date(complaint.createdAt);
      // Proveravamo validnost datuma
      return !isNaN(createdAt.getTime()) && format(createdAt, "yyyy-MM-dd") === format(currentDate, "yyyy-MM-dd");
    });

    const resolvedOnDay = complaints.filter(complaint => {
      if (!complaint.resolvedAt) return false;
      const resolvedAt = new Date(complaint.resolvedAt);
      // Proveravamo validnost datuma
      return !isNaN(resolvedAt.getTime()) && format(resolvedAt, "yyyy-MM-dd") === format(currentDate, "yyyy-MM-dd");
    });

    const closedOnDay = complaints.filter(complaint => {
      if (!complaint.closedAt) return false;
      const closedAt = new Date(complaint.closedAt);
      // Proveravamo validnost datuma
      return !isNaN(closedAt.getTime()) && format(closedAt, "yyyy-MM-dd") === format(currentDate, "yyyy-MM-dd");
    });

    result.push({
      date: dateStr,
      new: dayComplaints.length,
      resolved: resolvedOnDay.length,
      closed: closedOnDay.length,
      total: complaints.filter(c => {
        const createdAt = new Date(c.createdAt);
        // Proveravamo validnost datuma
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
    // ISPRAVLJENO: Ispravljen format string
    const monthStr = format(currentMonth, "MMM");

    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const monthComplaints = complaints.filter(complaint => {
      const createdAt = new Date(complaint.createdAt);
      // Proveravamo validnost datuma
      return !isNaN(createdAt.getTime()) && isWithinInterval(createdAt, { start: monthStart, end: monthEnd });
    });

    const serviceTypeCounts = {
      month: monthStr,
      VAS: 0,
      BULK: 0,
      HUMANITARIAN: 0,
      PARKING: 0,
    };

    monthComplaints.forEach(complaint => {
      // Proveravamo da li service i service.type postoje i da li je tip validan ServiceType
      if (complaint.service?.type && Object.values(ServiceType).includes(complaint.service.type)) {
        serviceTypeCounts[complaint.service.type as keyof typeof serviceTypeCounts] += 1;
      }
    });

    result.push(serviceTypeCounts);
  }

  return result;
}

/**
 * Generate anomaly detection data
 * @param complaints Array of complaints
 * @returns Any detected anomalies in the data
 */
// ISPRAVLJENO: Uklonjen uvoz za detectAnomalies iz drugog fajla
export function detectAnomalies(complaints: Complaint[]): Array<{
  type: "spike" | "unusual_resolution_time" | "high_rejection_rate";
  value: number;
  threshold: number;
  description: string;
}> {
  const anomalies = [];

  // Check for spikes in complaint volume
  const now = new Date(); // Definišemo 'now' ovde
  const last7Days = complaints.filter(c => {
    const createdAt = new Date(c.createdAt);
    // Proveravamo validnost datuma
    return !isNaN(createdAt.getTime()) && isWithinInterval(createdAt, {
      start: subDays(now, 7),
      end: now,
    });
  }).length;

  const prev7Days = complaints.filter(c => {
    const createdAt = new Date(c.createdAt);
    // Proveravamo validnost datuma
    return !isNaN(createdAt.getTime()) && isWithinInterval(createdAt, {
      start: subDays(now, 14),
      end: subDays(now, 7),
    });
  }).length;

  const percentChange = prev7Days > 0 ? ((last7Days - prev7Days) / prev7Days) * 100 : 0;

  if (percentChange > 50 && last7Days > 10) {
    anomalies.push({
      type: "spike",
      value: percentChange,
      threshold: 50,
      description: `Complaints volume increased by ${percentChange.toFixed(1)}% in the last 7 days compared to previous 7 days`,
    });
  }

  // Check for unusual resolution times
  const resolvedComplaints = complaints.filter(c => c.resolvedAt);
  const avgResolutionTime = calculateAverageResolutionTime(resolvedComplaints);

  const recentlyResolved = resolvedComplaints.filter(c => {
    if (!c.resolvedAt) return false; // Dodatna provera
    const resolvedAt = new Date(c.resolvedAt);
    // Proveravamo validnost datuma
    return !isNaN(resolvedAt.getTime()) && isWithinInterval(resolvedAt, {
      start: subDays(now, 7),
      end: now,
    });
  });

  const recentAvgResolutionTime = calculateAverageResolutionTime(recentlyResolved);

  if (recentAvgResolutionTime > avgResolutionTime * 1.5 && recentlyResolved.length > 5) {
    anomalies.push({
      type: "unusual_resolution_time",
      value: recentAvgResolutionTime,
      threshold: avgResolutionTime * 1.5,
      description: `Recent average resolution time (${recentAvgResolutionTime.toFixed(1)} days) is significantly higher than overall average (${avgResolutionTime.toFixed(1)} days)`,
    });
  }

  // Check for high rejection rates
  const rejectedComplaints = complaints.filter(c => c.status === ComplaintStatus.REJECTED);
  const rejectionRate = complaints.length > 0 ? (rejectedComplaints.length / complaints.length) * 100 : 0; // Dodata provera complaints.length

  if (rejectionRate > 15) {
    anomalies.push({
      type: "high_rejection_rate",
      value: rejectionRate,
      threshold: 15,
      description: `High complaint rejection rate of ${rejectionRate.toFixed(1)}% detected`,
    });
  }

  return anomalies;
}

// Funkcija za sumiranje statistika, pretpostavljamo da postoji i koristi gornje funkcije
export function calculateStatistics(complaints: Complaint[]): any {
//   // Implementacija koja koristi gornje funkcije
   const statusCounts = groupComplaintsByStatus(complaints);
   const avgResTime = calculateAverageResolutionTime(complaints);
   const resRate = calculateResolutionRate(complaints);
   // ... ostale statistike
   return {
     statusCounts,
     avgResTime,
    resRate,
      // ...
    };
  }
