///actions/analytics/get-financial-data.ts
"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { canViewFinancialData } from "@/lib/security/permission-checker";

export type FinancialDataParams = {
  startDate?: Date;
  endDate?: Date;
  serviceType?: string;
  providerId?: string;
};

export type FinancialMetrics = {
  totalRevenue: number;
  outstandingAmount: number;
  collectedAmount: number;
  canceledAmount: number;
  revenueByMonth: {
    month: string;
    revenue: number;
    collected: number;
    outstanding: number;
  }[];
  serviceTypeBreakdown: {
    serviceType: string;
    revenue: number;
    percentage: number;
  }[];
  providerBreakdown: {
    providerName: string;
    revenue: number;
    percentage: number;
  }[];
};

export async function getFinancialData({
  startDate,
  endDate,
  serviceType,
  providerId,
}: FinancialDataParams = {}): Promise<FinancialMetrics> {
  const session = await auth();
  if (!session?.user) throw new Error("Authentication required");

  const hasPermission = await canViewFinancialData();
  if (!hasPermission) throw new Error("You don't have permission to access financial data");

  const defaultEndDate = new Date();
  const defaultStartDate = new Date();
  defaultStartDate.setFullYear(defaultStartDate.getFullYear() - 1);

  const effectiveStartDate = startDate || defaultStartDate;
  const effectiveEndDate = endDate || defaultEndDate;
  effectiveStartDate.setHours(0, 0, 0, 0);
  effectiveEndDate.setHours(23, 59, 59, 999);

  // Querujemo sve 4 tabele paralelno
  const [vasData, parkingData, humanitarianData, bulkData] = await Promise.all([
    // VAS — skip ako filtriramo po tipu koji nije VAS
    (!serviceType || serviceType === "VAS")
      ? db.vasService.findMany({
          where: {
            mesec_pruzanja_usluge: { gte: effectiveStartDate, lte: effectiveEndDate },
            ...(providerId && { provajderId: providerId }),
          },
          include: { provider: true },
        })
      : [],

    // PARKING
    (!serviceType || serviceType === "PARKING")
      ? db.parkingTransaction.findMany({
          where: {
            date: { gte: effectiveStartDate, lte: effectiveEndDate },
          },
          include: { parkingService: true },
        })
      : [],

    // HUMANITARIAN
    (!serviceType || serviceType === "HUMANITARIAN")
      ? db.humanitarianTransaction.findMany({
          where: {
            date: { gte: effectiveStartDate, lte: effectiveEndDate },
          },
          include: { humanitarianOrg: true },
        })
      : [],

    // BULK — bulk nema amount, koristimo broj poruka kao proxy
    (!serviceType || serviceType === "BULK")
      ? db.bulkService.findMany({
          where: {
            datumNaplate: {
              gte: effectiveStartDate,
              lte: effectiveEndDate,
              not: null,
            },
          },
          include: { provider: true },
        })
      : [],
  ]);

  // Helper za ključ meseca
  const monthKey = (date: Date) =>
    date.toLocaleString("en-US", { month: "short", year: "2-digit" });

  // Agregacija po mesecu
  const monthlyMap = new Map<string, { revenue: number; collected: number; outstanding: number }>();

  const ensureMonth = (key: string) => {
    if (!monthlyMap.has(key)) {
      monthlyMap.set(key, { revenue: 0, collected: 0, outstanding: 0 });
    }
    return monthlyMap.get(key)!;
  };

  // VAS
  for (const item of vasData as any[]) {
    const entry = ensureMonth(monthKey(item.mesec_pruzanja_usluge));
    entry.revenue += item.fakturisan_iznos || 0;
    entry.collected += item.naplacen_iznos || 0;
    entry.outstanding += item.nenaplacen_iznos || 0;
  }

  // PARKING
  for (const item of parkingData as any[]) {
    const entry = ensureMonth(monthKey(item.date));
    entry.revenue += item.amount || 0;
    entry.collected += item.amount || 0; // parking se smatra naplaćenim
  }

  // HUMANITARIAN
  for (const item of humanitarianData as any[]) {
    const entry = ensureMonth(monthKey(item.date));
    entry.revenue += item.amount || 0;
    entry.collected += item.amount || 0;
  }

  // BULK — nema novčani iznos u shemi, preskačemo za revenue
  // ali možemo pratiti po mesecu ako dodate price polje u budućnosti

  // Popuni sve mesece u rangu
  const fullMonthRange = new Map<string, { revenue: number; collected: number; outstanding: number }>();
  const cur = new Date(effectiveStartDate);
  while (cur <= effectiveEndDate) {
    const key = monthKey(cur);
    fullMonthRange.set(key, monthlyMap.get(key) || { revenue: 0, collected: 0, outstanding: 0 });
    cur.setMonth(cur.getMonth() + 1);
  }

  const revenueByMonth = Array.from(fullMonthRange.entries())
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => {
      const [am, ay] = a.month.split(" ");
      const [bm, by] = b.month.split(" ");
      return new Date(`${am} 01 20${ay}`).getTime() - new Date(`${bm} 01 20${by}`).getTime();
    });

  // Service type breakdown
  const serviceTypeMap: Record<string, number> = {};

  for (const item of vasData as any[]) {
    serviceTypeMap["VAS"] = (serviceTypeMap["VAS"] || 0) + (item.fakturisan_iznos || 0);
  }
  for (const item of parkingData as any[]) {
    serviceTypeMap["PARKING"] = (serviceTypeMap["PARKING"] || 0) + (item.amount || 0);
  }
  for (const item of humanitarianData as any[]) {
    serviceTypeMap["HUMANITARIAN"] = (serviceTypeMap["HUMANITARIAN"] || 0) + (item.amount || 0);
  }

  // Provider breakdown
  const providerMap: Record<string, number> = {};

  for (const item of vasData as any[]) {
    const name = item.provider?.name ?? "Unknown";
    providerMap[name] = (providerMap[name] || 0) + (item.fakturisan_iznos || 0);
  }
  for (const item of parkingData as any[]) {
    const name = item.parkingService?.name ?? "Unknown";
    providerMap[name] = (providerMap[name] || 0) + (item.amount || 0);
  }
  for (const item of humanitarianData as any[]) {
    const name = item.humanitarianOrg?.name ?? "Unknown";
    providerMap[name] = (providerMap[name] || 0) + (item.amount || 0);
  }

  const totalRevenue = Object.values(serviceTypeMap).reduce((s, v) => s + v, 0);
  const totalCollected =
    (vasData as any[]).reduce((s, i) => s + (i.naplacen_iznos || 0), 0) +
    (parkingData as any[]).reduce((s, i) => s + (i.amount || 0), 0) +
    (humanitarianData as any[]).reduce((s, i) => s + (i.amount || 0), 0);
  const totalOutstanding =
    (vasData as any[]).reduce((s, i) => s + (i.nenaplacen_iznos || 0), 0);
  const totalCanceled =
    (vasData as any[]).reduce((s, i) => s + (i.otkazan_iznos || 0), 0);

  return {
    totalRevenue,
    outstandingAmount: totalOutstanding,
    collectedAmount: totalCollected,
    canceledAmount: totalCanceled,
    revenueByMonth,
    serviceTypeBreakdown: Object.entries(serviceTypeMap).map(([st, revenue]) => ({
      serviceType: st,
      revenue,
      percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0,
    })),
    providerBreakdown: Object.entries(providerMap)
      .map(([providerName, revenue]) => ({
        providerName,
        revenue,
        percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10),
  };
}