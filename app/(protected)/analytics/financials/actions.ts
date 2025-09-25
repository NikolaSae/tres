// app/(protected)/analytics/financials/actions.ts

"use server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
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
  const hasPermission = await canViewFinancialData();
  if (!hasPermission) {
    throw new Error("You don't have permission to access financial data");
  }

  const defaultEndDate = new Date();
  const defaultStartDate = new Date();
  defaultStartDate.setFullYear(defaultStartDate.getFullYear() - 1);

  const effectiveStartDate = startDate || defaultStartDate;
  const effectiveEndDate = endDate || defaultEndDate;

  const vasData = await db.vasService.findMany({
    where: {
      mesec_pruzanja_usluge: {
        gte: effectiveStartDate,
        lte: effectiveEndDate,
      },
      ...(serviceType ? { serviceId: serviceType } : {}), // Koristi serviceId, serviceType parameter (koji je zapravo ID)
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

  const monthlyData = vasData.reduce((acc, item) => {
    const monthYear = item.mesec_pruzanja_usluge.toLocaleString('en-US', { month: 'short', year: '2-digit' });

    if (!acc[monthYear]) {
      acc[monthYear] = {
        revenue: 0,
        collected: 0,
        outstanding: 0,
      };
    }

    acc[monthYear].revenue += item.fakturisan_iznos || 0;
    acc[monthYear].collected += item.naplacen_iznos || 0;
    acc[monthYear].outstanding += item.nenaplacen_iznos || 0;

    return acc;
  }, {} as Record<string, { revenue: number; collected: number; outstanding: number; }>);

  const fullMonthRangeData: Record<string, { revenue: number; collected: number; outstanding: number }> = {};
  let currentDate = new Date(effectiveStartDate);
  while (currentDate <= effectiveEndDate) {
      const monthYear = currentDate.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      fullMonthRangeData[monthYear] = monthlyData[monthYear] || { revenue: 0, collected: 0, outstanding: 0 };
      currentDate.setMonth(currentDate.getMonth() + 1);
  }

  const revenueByMonth = Object.entries(fullMonthRangeData)
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

    acc[type] += item.fakturisan_iznos || 0;

    return acc;
  }, {} as Record<string, number>);

  const providerData = vasData.reduce((acc, item) => {
    const name = item.provider.name;

    if (!acc[name]) {
      acc[name] = 0;
    }

    acc[name] += item.fakturisan_iznos || 0;

    return acc;
  }, {} as Record<string, number>);

  const totalRevenue = vasData.reduce((sum, item) => sum + (item.fakturisan_iznos || 0), 0);
  const collectedAmount = vasData.reduce((sum, item) => sum + (item.naplacen_iznos || 0), 0);
  const outstandingAmount = vasData.reduce((sum, item) => sum + (item.nenaplacen_iznos || 0), 0);
  const canceledAmount = vasData.reduce((sum, item) => sum + (item.otkazan_iznos || 0), 0);

  const serviceTypeBreakdown = Object.entries(serviceTypeData).map(([serviceType, revenue]) => ({
    serviceType,
    revenue,
    percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0,
  }));

  const providerBreakdown = Object.entries(providerData)
    .map(([providerName, revenue]) => ({
      providerName,
      revenue,
      percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  return {
    totalRevenue,
    outstandingAmount,
    collectedAmount,
    canceledAmount,
    revenueByMonth,
    serviceTypeBreakdown,
    providerBreakdown,
  };
}