///actions/analytics/get-financial-data.ts
"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { canViewFinancialData } from "@/lib/security/permission-checker";
import { ServiceType } from "@prisma/client";

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

  // ✅ FIX: ServiceType enum umesto string, Prisma razume samo enum vrednosti
  const serviceTypeEnum = serviceType
    ? Object.values(ServiceType).includes(serviceType as ServiceType)
      ? (serviceType as ServiceType)
      : undefined
    : undefined;

  const vasData = await db.vasService.findMany({
    where: {
      mesec_pruzanja_usluge: {
        gte: effectiveStartDate,
        lte: effectiveEndDate,
      },
      ...(serviceTypeEnum && { service: { type: serviceTypeEnum } }),
      ...(providerId && { provajderId: providerId }),
    },
    include: {
      service: true,
      provider: true,
    },
    orderBy: { mesec_pruzanja_usluge: "asc" },
  });

  const monthlyData = vasData.reduce(
    (acc, item) => {
      const monthYear = item.mesec_pruzanja_usluge.toLocaleString("en-US", {
        month: "short",
        year: "2-digit",
      });
      if (!acc[monthYear]) acc[monthYear] = { revenue: 0, collected: 0, outstanding: 0 };
      acc[monthYear].revenue += item.fakturisan_iznos || 0;
      acc[monthYear].collected += item.naplacen_iznos || 0;
      acc[monthYear].outstanding += item.nenaplacen_iznos || 0;
      return acc;
    },
    {} as Record<string, { revenue: number; collected: number; outstanding: number }>
  );

  const fullMonthRange: Record<string, { revenue: number; collected: number; outstanding: number }> = {};
  const cur = new Date(effectiveStartDate);
  while (cur <= effectiveEndDate) {
    const key = cur.toLocaleString("en-US", { month: "short", year: "2-digit" });
    fullMonthRange[key] = monthlyData[key] || { revenue: 0, collected: 0, outstanding: 0 };
    cur.setMonth(cur.getMonth() + 1);
  }

  const revenueByMonth = Object.entries(fullMonthRange)
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => {
      const [am, ay] = a.month.split(" ");
      const [bm, by] = b.month.split(" ");
      return new Date(`${am} 01 20${ay}`).getTime() - new Date(`${bm} 01 20${by}`).getTime();
    });

  // ✅ FIX: item.service.type je ServiceType enum — toString() za konzistentnost
  const serviceTypeData = vasData.reduce((acc, item) => {
    const type = item.service.type.toString();
    acc[type] = (acc[type] || 0) + (item.fakturisan_iznos || 0);
    return acc;
  }, {} as Record<string, number>);

  // ✅ FIX: item.provider.name — provider je include-ovan, TypeScript sada zna
  const providerData = vasData.reduce((acc, item) => {
    const name = item.provider.name;
    acc[name] = (acc[name] || 0) + (item.fakturisan_iznos || 0);
    return acc;
  }, {} as Record<string, number>);

  const totalRevenue = vasData.reduce((sum, item) => sum + (item.fakturisan_iznos || 0), 0);
  const collectedAmount = vasData.reduce((sum, item) => sum + (item.naplacen_iznos || 0), 0);
  const outstandingAmount = vasData.reduce((sum, item) => sum + (item.nenaplacen_iznos || 0), 0);
  const canceledAmount = vasData.reduce((sum, item) => sum + (item.otkazan_iznos || 0), 0);

  return {
    totalRevenue,
    outstandingAmount,
    collectedAmount,
    canceledAmount,
    revenueByMonth,
    serviceTypeBreakdown: Object.entries(serviceTypeData).map(([st, revenue]) => ({
      serviceType: st,
      revenue,
      percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0,
    })),
    providerBreakdown: Object.entries(providerData)
      .map(([providerName, revenue]) => ({
        providerName,
        revenue,
        percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10),
  };
}