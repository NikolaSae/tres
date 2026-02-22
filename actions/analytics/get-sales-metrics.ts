///actions/analytics/get-sales-metrics.ts
"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { canViewSalesData } from "@/lib/security/permission-checker";
import { ServiceType, Prisma } from "@prisma/client";

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
  comparisonStartDate.setHours(0, 0, 0, 0);
  comparisonEndDate.setHours(23, 59, 59, 999);

  // ✅ FIX: Typed where filter umesto spread — eliminise TypeScript grešku
  const serviceTypeEnum = serviceType
    ? Object.values(ServiceType).includes(serviceType as ServiceType)
      ? (serviceType as ServiceType)
      : undefined
    : undefined;

  const baseWhere: Prisma.VasServiceWhereInput = {
    ...(serviceTypeEnum && { service: { type: serviceTypeEnum } }),
    ...(providerId && { provajderId: providerId }),
  };

  const [vasData, comparisonData] = await Promise.all([
    db.vasService.findMany({
      where: {
        mesec_pruzanja_usluge: { gte: effectiveStartDate, lte: effectiveEndDate },
        ...baseWhere,
      },
      include: { service: true, provider: true },
      orderBy: { mesec_pruzanja_usluge: "asc" },
    }),
    db.vasService.findMany({
      where: {
        mesec_pruzanja_usluge: { gte: comparisonStartDate, lte: comparisonEndDate },
        ...baseWhere,
      },
      select: { broj_transakcija: true, fakturisan_iznos: true },
    }),
  ]);

  const monthlyData = vasData.reduce(
    (acc, item) => {
      const key = item.mesec_pruzanja_usluge.toLocaleString("en-US", {
        month: "short",
        year: "2-digit",
      });
      if (!acc[key]) acc[key] = { transactions: 0, revenue: 0 };
      acc[key].transactions += item.broj_transakcija || 0;
      acc[key].revenue += item.fakturisan_iznos || 0;
      return acc;
    },
    {} as Record<string, { transactions: number; revenue: number }>
  );

  const fullMonthRange: Record<string, { transactions: number; revenue: number }> = {};
  const cur = new Date(effectiveStartDate);
  while (cur <= effectiveEndDate) {
    const key = cur.toLocaleString("en-US", { month: "short", year: "2-digit" });
    fullMonthRange[key] = monthlyData[key] || { transactions: 0, revenue: 0 };
    cur.setMonth(cur.getMonth() + 1);
  }

  const transactionsByMonth = Object.entries(fullMonthRange)
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => {
      const [am, ay] = a.month.split(" ");
      const [bm, by] = b.month.split(" ");
      return new Date(`${am} 01 20${ay}`).getTime() - new Date(`${bm} 01 20${by}`).getTime();
    });

  // ✅ FIX: service i provider su include-ovani, TypeScript sada zna za ova polja
  const serviceTypeData = vasData.reduce((acc, item) => {
    const type = item.service.type.toString();
    acc[type] = (acc[type] || 0) + (item.broj_transakcija || 0);
    return acc;
  }, {} as Record<string, number>);

  const providerData = vasData.reduce(
    (acc, item) => {
      const name = item.provider.name;
      if (!acc[name]) acc[name] = { transactions: 0, revenue: 0 };
      acc[name].transactions += item.broj_transakcija || 0;
      acc[name].revenue += item.fakturisan_iznos || 0;
      return acc;
    },
    {} as Record<string, { transactions: number; revenue: number }>
  );

  const totalTransactions = vasData.reduce((sum, item) => sum + (item.broj_transakcija || 0), 0);
  const totalRevenue = vasData.reduce((sum, item) => sum + (item.fakturisan_iznos || 0), 0);
  const prevTotalTransactions = comparisonData.reduce((sum, item) => sum + (item.broj_transakcija || 0), 0);
  const prevTotalRevenue = comparisonData.reduce((sum, item) => sum + (item.fakturisan_iznos || 0), 0);

  return {
    totalTransactions,
    totalRevenue,
    averageTransactionValue: totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
    transactionsByMonth,
    transactionsByServiceType: Object.entries(serviceTypeData).map(([st, transactions]) => ({
      serviceType: st,
      transactions,
      percentage: totalTransactions > 0 ? (transactions / totalTransactions) * 100 : 0,
    })),
    topProviders: Object.entries(providerData)
      .map(([providerName, data]) => ({ providerName, ...data }))
      .sort((a, b) => b.transactions - a.transactions)
      .slice(0, 10),
    growthRate: {
      transactionsGrowth:
        prevTotalTransactions > 0
          ? ((totalTransactions - prevTotalTransactions) / prevTotalTransactions) * 100
          : totalTransactions > 0 ? 100 : 0,
      revenueGrowth:
        prevTotalRevenue > 0
          ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100
          : totalRevenue > 0 ? 100 : 0,
    },
  };
}