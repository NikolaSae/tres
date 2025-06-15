///actions/analytics/get-financial-data.ts

"use server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { canViewFinancialData } from "@/lib/security/permission-checker";
// Uklonjen import za revalidatePath jer se ne koristi u ovoj akciji na ovaj način
// import { revalidatePath } from "next/cache"; // <--- REMOVED

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
  // Authentication check removed based on previous permission checker code structure
  // The permission check below relies on getCurrentUser() which handles authentication
  // const user = await currentUser();

  // if (!user) {
  //   throw new Error("Authentication required");
  // }

  // Check if the user has permission to view financial data
  // Assuming canViewFinancialData internally checks authentication using getCurrentUser()
  const hasPermission = await canViewFinancialData(/* user.id */); // Pass user ID if needed in permission checker
  if (!hasPermission) {
    // Use a more standard error or redirect pattern for unauthorized access in Server Actions
    // Depending on your auth flow, you might return null, throw a specific error, or redirect earlier in page.tsx
    // For consistency with App Router data fetching, throwing an error is common if access is denied here.
    throw new Error("You don't have permission to access financial data"); // This error will be caught by parent Suspense boundary or Error boundary
    // Alternatively, if called from a Client Component, you might return a specific error object:
    // return { error: "Permission denied" } as any; // Example if returning error object
  }

  // Set default date range to last 12 months if not provided
  const defaultEndDate = new Date();
  const defaultStartDate = new Date();
  defaultStartDate.setFullYear(defaultStartDate.getFullYear() - 1);

  const effectiveStartDate = startDate || defaultStartDate;
  const effectiveEndDate = endDate || defaultEndDate;

  // Query VAS service data
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

  // Group by month for time series
  const monthlyData = vasData.reduce((acc, item) => {
    // Adjusting date formatting for consistency, e.g., "Jan 23"
    const monthYear = item.mesec_pruzanja_usluge.toLocaleString('en-US', { month: 'short', year: '2-digit' });

    if (!acc[monthYear]) {
      acc[monthYear] = {
        revenue: 0,
        collected: 0,
        outstanding: 0,
      };
    }

    acc[monthYear].revenue += item.fakturisan_iznos || 0; // Add null check
    acc[monthYear].collected += item.naplacen_iznos || 0; // Add null check
    acc[monthYear].outstanding += item.nenaplacen_iznos || 0; // Add null check

    return acc;
  }, {} as Record<string, { revenue: number; collected: number; outstanding: number; }>);


  // Format monthly data - ensure all months in the range are included even if no data
  const dateDiff = effectiveEndDate.getTime() - effectiveStartDate.getTime();
  const monthsDiff = Math.ceil(dateDiff / (1000 * 60 * 60 * 24 * 30.44)); // Approx months

  const fullMonthRangeData: Record<string, { revenue: number; collected: number; outstanding: number }> = {};
  let currentDate = new Date(effectiveStartDate);
  while (currentDate <= effectiveEndDate) {
      const monthYear = currentDate.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      fullMonthRangeData[monthYear] = monthlyData[monthYear] || { revenue: 0, collected: 0, outstanding: 0 };
      currentDate.setMonth(currentDate.getMonth() + 1);
  }
  // Convert to array and sort chronologically
  const revenueByMonth = Object.entries(fullMonthRangeData)
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => {
        const [aMonth, aYear] = a.month.split(' ');
        const [bMonth, bYear] = b.month.split(' ');
        const dateA = new Date(`${aMonth} 01 20${aYear}`);
        const dateB = new Date(`${bMonth} 01 20${bYear}`);
        return dateA.getTime() - dateB.getTime();
    });


  // Group by service type
  const serviceTypeData = vasData.reduce((acc, item) => {
    const type = item.service.type;

    if (!acc[type]) {
      acc[type] = 0;
    }

    acc[type] += item.fakturisan_iznos || 0; // Add null check

    return acc;
  }, {} as Record<string, number>);

  // Group by provider
  const providerData = vasData.reduce((acc, item) => {
    const name = item.provider.name;

    if (!acc[name]) {
      acc[name] = 0;
    }

    acc[name] += item.fakturisan_iznos || 0; // Add null check

    return acc;
  }, {} as Record<string, number>);

  // Calculate totals
  const totalRevenue = vasData.reduce((sum, item) => sum + (item.fakturisan_iznos || 0), 0);
  const collectedAmount = vasData.reduce((sum, item) => sum + (item.naplacen_iznos || 0), 0);
  const outstandingAmount = vasData.reduce((sum, item) => sum + (item.nenaplacen_iznos || 0), 0);
  const canceledAmount = vasData.reduce((sum, item) => sum + (item.otkazan_iznos || 0), 0);

  // Format data for response


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
    .slice(0, 10); // Top 10 providers

  // REMOVED: revalidatePath("/analytics/financials"); // <--- THIS LINE WAS REMOVED

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