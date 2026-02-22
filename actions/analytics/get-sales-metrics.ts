///actions/analytics/get-sales-metrics.ts
"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { canViewSalesData } from "@/lib/security/permission-checker";

export type SalesMetricsParams = {
  startDate?: Date;
  endDate?: Date;
  serviceType?: string;
  providerId?: string;
};

export type SalesMetrics = {
  totalTransactions: number;
  totalRevenue: number;
  averageTransactionValue: number;
  transactionsByMonth: { month: string; transactions: number; revenue: number }[];
  transactionsByServiceType: { serviceType: string; transactions: number; percentage: number }[];
  topProviders: { providerName: string; transactions: number; revenue: number }[];
  growthRate: { transactionsGrowth: number; revenueGrowth: number };
};

export async function getSalesMetrics({
  startDate,
  endDate,
  serviceType,
  providerId,
}: SalesMetricsParams = {}): Promise<SalesMetrics> {
  const session = await auth();
  if (!session?.user) throw new Error("Authentication required");

  const hasPermission = await canViewSalesData();
  if (!hasPermission) throw new Error("You don't have permission to access sales data");

  const defaultEndDate = new Date();
  const defaultStartDate = new Date();
  defaultStartDate.setFullYear(defaultStartDate.getFullYear() - 1);

  const effectiveStartDate = startDate || defaultStartDate;
  const effectiveEndDate = endDate || defaultEndDate;
  effectiveStartDate.setHours(0, 0, 0, 0);
  effectiveEndDate.setHours(23, 59, 59, 999);

  const periodLengthMs = effectiveEndDate.getTime() - effectiveStartDate.getTime();
  const comparisonStartDate = new Date(effectiveStartDate.getTime() - periodLengthMs);
  const comparisonEndDate = new Date(effectiveStartDate.getTime() - 1);

  const monthKey = (date: Date) =>
    date.toLocaleString("en-US", { month: "short", year: "2-digit" });

  // Trenutni period — sve tabele paralelno
  const [vasData, parkingData, humanitarianData,
         vasComp, parkingComp, humanitarianComp] = await Promise.all([
    (!serviceType || serviceType === "VAS")
      ? db.vasService.findMany({
          where: {
            mesec_pruzanja_usluge: { gte: effectiveStartDate, lte: effectiveEndDate },
            ...(providerId && { provajderId: providerId }),
          },
          include: { provider: true },
        })
      : [],

    (!serviceType || serviceType === "PARKING")
      ? db.parkingTransaction.findMany({
          where: { date: { gte: effectiveStartDate, lte: effectiveEndDate } },
          include: { parkingService: true },
        })
      : [],

    (!serviceType || serviceType === "HUMANITARIAN")
      ? db.humanitarianTransaction.findMany({
          where: { date: { gte: effectiveStartDate, lte: effectiveEndDate } },
          include: { humanitarianOrg: true },
        })
      : [],

    // Comparison period
    db.vasService.findMany({
      where: { mesec_pruzanja_usluge: { gte: comparisonStartDate, lte: comparisonEndDate } },
      select: { broj_transakcija: true, fakturisan_iznos: true },
    }),
    db.parkingTransaction.findMany({
      where: { date: { gte: comparisonStartDate, lte: comparisonEndDate } },
      select: { quantity: true, amount: true },
    }),
    db.humanitarianTransaction.findMany({
      where: { date: { gte: comparisonStartDate, lte: comparisonEndDate } },
      select: { quantity: true, amount: true },
    }),
  ]);

  // Mesečna agregacija
  const monthlyMap = new Map<string, { transactions: number; revenue: number }>();
  const ensureMonth = (key: string) => {
    if (!monthlyMap.has(key)) monthlyMap.set(key, { transactions: 0, revenue: 0 });
    return monthlyMap.get(key)!;
  };

  for (const item of vasData as any[]) {
    const e = ensureMonth(monthKey(item.mesec_pruzanja_usluge));
    e.transactions += item.broj_transakcija || 0;
    e.revenue += item.fakturisan_iznos || 0;
  }
  for (const item of parkingData as any[]) {
    const e = ensureMonth(monthKey(item.date));
    e.transactions += item.quantity || 0;
    e.revenue += item.amount || 0;
  }
  for (const item of humanitarianData as any[]) {
    const e = ensureMonth(monthKey(item.date));
    e.transactions += item.quantity || 0;
    e.revenue += item.amount || 0;
  }

  // Popuni sve mesece
  const fullMonthRange = new Map<string, { transactions: number; revenue: number }>();
  const cur = new Date(effectiveStartDate);
  while (cur <= effectiveEndDate) {
    const key = monthKey(cur);
    fullMonthRange.set(key, monthlyMap.get(key) || { transactions: 0, revenue: 0 });
    cur.setMonth(cur.getMonth() + 1);
  }

  const transactionsByMonth = Array.from(fullMonthRange.entries())
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => {
      const [am, ay] = a.month.split(" ");
      const [bm, by] = b.month.split(" ");
      return new Date(`${am} 01 20${ay}`).getTime() - new Date(`${bm} 01 20${by}`).getTime();
    });

  // Service type breakdown
  const serviceTypeMap: Record<string, number> = {};
  for (const item of vasData as any[]) {
    serviceTypeMap["VAS"] = (serviceTypeMap["VAS"] || 0) + (item.broj_transakcija || 0);
  }
  for (const item of parkingData as any[]) {
    serviceTypeMap["PARKING"] = (serviceTypeMap["PARKING"] || 0) + (item.quantity || 0);
  }
  for (const item of humanitarianData as any[]) {
    serviceTypeMap["HUMANITARIAN"] = (serviceTypeMap["HUMANITARIAN"] || 0) + (item.quantity || 0);
  }

  // Provider breakdown
  const providerMap: Record<string, { transactions: number; revenue: number }> = {};
  for (const item of vasData as any[]) {
    const name = item.provider?.name ?? "Unknown";
    if (!providerMap[name]) providerMap[name] = { transactions: 0, revenue: 0 };
    providerMap[name].transactions += item.broj_transakcija || 0;
    providerMap[name].revenue += item.fakturisan_iznos || 0;
  }
  for (const item of parkingData as any[]) {
    const name = item.parkingService?.name ?? "Unknown";
    if (!providerMap[name]) providerMap[name] = { transactions: 0, revenue: 0 };
    providerMap[name].transactions += item.quantity || 0;
    providerMap[name].revenue += item.amount || 0;
  }
  for (const item of humanitarianData as any[]) {
    const name = item.humanitarianOrg?.name ?? "Unknown";
    if (!providerMap[name]) providerMap[name] = { transactions: 0, revenue: 0 };
    providerMap[name].transactions += item.quantity || 0;
    providerMap[name].revenue += item.amount || 0;
  }

  const totalTransactions =
    (vasData as any[]).reduce((s, i) => s + (i.broj_transakcija || 0), 0) +
    (parkingData as any[]).reduce((s, i) => s + (i.quantity || 0), 0) +
    (humanitarianData as any[]).reduce((s, i) => s + (i.quantity || 0), 0);

  const totalRevenue =
    (vasData as any[]).reduce((s, i) => s + (i.fakturisan_iznos || 0), 0) +
    (parkingData as any[]).reduce((s, i) => s + (i.amount || 0), 0) +
    (humanitarianData as any[]).reduce((s, i) => s + (i.amount || 0), 0);

  const prevTransactions =
    (vasComp as any[]).reduce((s, i) => s + (i.broj_transakcija || 0), 0) +
    (parkingComp as any[]).reduce((s, i) => s + (i.quantity || 0), 0) +
    (humanitarianComp as any[]).reduce((s, i) => s + (i.quantity || 0), 0);

  const prevRevenue =
    (vasComp as any[]).reduce((s, i) => s + (i.fakturisan_iznos || 0), 0) +
    (parkingComp as any[]).reduce((s, i) => s + (i.amount || 0), 0) +
    (humanitarianComp as any[]).reduce((s, i) => s + (i.amount || 0), 0);

  return {
    totalTransactions,
    totalRevenue,
    averageTransactionValue: totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
    transactionsByMonth,
    transactionsByServiceType: Object.entries(serviceTypeMap).map(([st, transactions]) => ({
      serviceType: st,
      transactions,
      percentage: totalTransactions > 0 ? (transactions / totalTransactions) * 100 : 0,
    })),
    topProviders: Object.entries(providerMap)
      .map(([providerName, data]) => ({ providerName, ...data }))
      .sort((a, b) => b.transactions - a.transactions)
      .slice(0, 10),
    growthRate: {
      transactionsGrowth:
        prevTransactions > 0
          ? ((totalTransactions - prevTransactions) / prevTransactions) * 100
          : totalTransactions > 0 ? 100 : 0,
      revenueGrowth:
        prevRevenue > 0
          ? ((totalRevenue - prevRevenue) / prevRevenue) * 100
          : totalRevenue > 0 ? 100 : 0,
    },
  };
}