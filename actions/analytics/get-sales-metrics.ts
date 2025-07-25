///actions/analytics/get-sales-metrics.ts

"use server";

import { db } from "@/lib/db";
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
  transactionsByMonth: {
    month: string;
    transactions: number;
    revenue: number;
  }[];
  transactionsByServiceType: {
    serviceType: string;
    transactions: number;
    percentage: number;
  }[];
  topProviders: {
    providerName: string;
    transactions: number;
    revenue: number;
  }[];
  growthRate: {
    transactionsGrowth: number;
    revenueGrowth: number;
  };
};

export async function getSalesMetrics({
  startDate,
  endDate,
  serviceType,
  providerId,
}: SalesMetricsParams = {}): Promise<SalesMetrics> {

  const hasPermission = await canViewSalesData;
  if (!hasPermission) {
    throw new Error("You don't have permission to access sales data");
  }
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

  const vasData = await db.vasService.findMany({
    where: {
      mesec_pruzanja_usluge: {
        gte: effectiveStartDate,
        lte: effectiveEndDate,
      },
      ...(serviceType ? { service: { type: serviceType as any } } : {}),
      ...(providerId ? { provajderId: providerId } : {}),
    },
    include: {
      service: true,
      provider: true,
    },
    orderBy: {
      mesec_pruzanja_usluge: "asc",
    },
  });

  const comparisonData = await db.vasService.findMany({
    where: {
      mesec_pruzanja_usluge: {
        gte: comparisonStartDate,
        lte: comparisonEndDate,
      },
      ...(serviceType ? { service: { type: serviceType as any } } : {}),
      ...(providerId ? { provajderId: providerId } : {}),
    },
    select: {
        broj_transakcija: true,
        fakturisan_iznos: true,
    }
  });

  const monthlyData = vasData.reduce((acc, item) => {

    const monthYear = item.mesec_pruzanja_usluge.toLocaleString('en-US', { month: 'short', year: '2-digit' });

    if (!acc[monthYear]) {
      acc[monthYear] = {
        transactions: 0,
        revenue: 0,
      };
    }

    acc[monthYear].transactions += item.broj_transakcija || 0;
    acc[monthYear].revenue += item.fakturisan_iznos || 0;

    return acc;
  }, {} as Record<string, { transactions: number; revenue: number; }>);

  const fullMonthRangeData: Record<string, { transactions: number; revenue: number }> = {};
  let currentDate = new Date(effectiveStartDate);
  while (currentDate <= effectiveEndDate) {
      const monthYear = currentDate.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      fullMonthRangeData[monthYear] = monthlyData[monthYear] || { transactions: 0, revenue: 0 };
      currentDate.setMonth(currentDate.getMonth() + 1);
  }
  const transactionsByMonth = Object.entries(fullMonthRangeData)
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => {
        const [aMonth, aYear] = a.month.split(' ');
        const [bMonth, bYear] = b.month.split(' ');
        const dateA = new Date(`${aMonth} 01 20${aYear}`);
        const dateB = new Date(`${bMonth} 01 20${bYear}`);
        return dateA.getTime() - dateB.getTime();
    });


  const serviceTypeData = vasData.reduce((acc, item) => {
    const type = item.service.type;

    if (!acc[type]) {
      acc[type] = 0;
    }

    acc[type] += item.broj_transakcija || 0;

    return acc;
  }, {} as Record<string, number>);

  const providerData = vasData.reduce((acc, item) => {
    const name = item.provider.name;

    if (!acc[name]) {
      acc[name] = {
        transactions: 0,
        revenue: 0,
      };
    }

    acc[name].transactions += item.broj_transakcija || 0;
    acc[name].revenue += item.fakturisan_iznos || 0;

    return acc;
  }, {} as Record<string, { transactions: number; revenue: number; }>);

  const totalTransactions = vasData.reduce((sum, item) => sum + (item.broj_transakcija || 0), 0);
  const totalRevenue = vasData.reduce((sum, item) => sum + (item.fakturisan_iznos || 0), 0);
  const averageTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  const prevTotalTransactions = comparisonData.reduce((sum, item) => sum + (item.broj_transakcija || 0), 0);
  const prevTotalRevenue = comparisonData.reduce((sum, item) => sum + (item.fakturisan_iznos || 0), 0);

  const transactionsGrowth = prevTotalTransactions > 0
    ? ((totalTransactions - prevTotalTransactions) / prevTotalTransactions) * 100
    : (totalTransactions > 0 ? 100 : 0);

  const revenueGrowth = prevTotalRevenue > 0
    ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100
    : (totalRevenue > 0 ? 100 : 0);

  const transactionsByServiceType = Object.entries(serviceTypeData).map(([serviceType, transactions]) => ({
    serviceType,
    transactions,
    percentage: totalTransactions > 0 ? (transactions / totalTransactions) * 100 : 0,
  }));

  const topProviders = Object.entries(providerData)
    .map(([providerName, data]) => ({
      providerName,
      transactions: data.transactions,
      revenue: data.revenue,
    }))
    .sort((a, b) => b.transactions - a.transactions)
    .slice(0, 10);

  return {
    totalTransactions,
    totalRevenue,
    averageTransactionValue,
    transactionsByMonth,
    transactionsByServiceType,
    topProviders,
    growthRate: {
      transactionsGrowth,
      revenueGrowth,
    },
  };
}