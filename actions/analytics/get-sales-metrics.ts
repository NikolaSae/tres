///actions/analytics/get-sales-metrics.ts

"use server";

import { db } from "@/lib/db";
// Uklonjeno jer se user provera unutar canViewSalesData
// import { currentUser } from "@/lib/auth";
import { canViewSalesData } from "@/lib/security/permission-checker";
// Uklonjen import za revalidatePath jer se ne koristi u ovoj akciji na ovaj način
// import { revalidatePath } from "next/cache"; // <--- REMOVED

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
  // Authentication check removed here, should be handled by canViewSalesData or page-level access control
  // const user = await currentUser();
  // if (!user) {
  //   throw new Error("Authentication required");
  // }

  // Check if the user has permission to view sales data
  const hasPermission = await canViewSalesData(/* user.id */); // Pass user ID if needed
  if (!hasPermission) {
    // Throw an error if permission is denied, this will be caught by the parent Suspense/Error boundary
    throw new Error("You don't have permission to access sales data");
  }

  // Set default date range to last 12 months if not provided
  const defaultEndDate = new Date();
  const defaultStartDate = new Date();
  defaultStartDate.setFullYear(defaultStartDate.getFullYear() - 1);

  const effectiveStartDate = startDate || defaultStartDate;
  const effectiveEndDate = endDate || defaultEndDate;

   // Ensure dates are treated as start/end of day for comparisons if needed
   effectiveStartDate.setHours(0, 0, 0, 0);
   effectiveEndDate.setHours(23, 59, 59, 999);


  // Calculate comparison period for growth metrics
  const periodLengthMs = effectiveEndDate.getTime() - effectiveStartDate.getTime();
  const comparisonStartDate = new Date(effectiveStartDate.getTime() - periodLengthMs);
  const comparisonEndDate = new Date(effectiveStartDate.getTime() - 1); // Just before current period

   comparisonStartDate.setHours(0, 0, 0, 0);
   comparisonEndDate.setHours(23, 59, 59, 999);


  // Query current period VAS service data
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
      service: true, // Needed for service type breakdown
      provider: true, // Needed for provider breakdown
    },
    orderBy: {
      mesec_pruzanja_usluge: "asc",
    },
  });

  // Query comparison period data for growth calculation
  const comparisonData = await db.vasService.findMany({
    where: {
      mesec_pruzanja_usluge: {
        gte: comparisonStartDate,
        lte: comparisonEndDate,
      },
      ...(serviceType ? { service: { type: serviceType as any } } : {}),
      ...(providerId ? { provajderId: providerId } : {}),
    },
     // Only select needed fields for comparison calculation
    select: {
        broj_transakcija: true,
        fakturisan_iznos: true,
    }
  });

   // --- Aggregation and Calculation ---

  // Group by month for time series
  const monthlyData = vasData.reduce((acc, item) => {
     // Adjusting date formatting for consistency
    const monthYear = item.mesec_pruzanja_usluge.toLocaleString('en-US', { month: 'short', year: '2-digit' });

    if (!acc[monthYear]) {
      acc[monthYear] = {
        transactions: 0,
        revenue: 0,
      };
    }

    acc[monthYear].transactions += item.broj_transakcija || 0; // Add null check
    acc[monthYear].revenue += item.fakturisan_iznos || 0; // Add null check

    return acc;
  }, {} as Record<string, { transactions: number; revenue: number; }>);

   // Format monthly data - ensure all months in the range are included even if no data
  const fullMonthRangeData: Record<string, { transactions: number; revenue: number }> = {};
  let currentDate = new Date(effectiveStartDate);
  while (currentDate <= effectiveEndDate) {
      const monthYear = currentDate.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      fullMonthRangeData[monthYear] = monthlyData[monthYear] || { transactions: 0, revenue: 0 };
      currentDate.setMonth(currentDate.getMonth() + 1);
  }
   // Convert to array and sort chronologically
  const transactionsByMonth = Object.entries(fullMonthRangeData)
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

    acc[type] += item.broj_transakcija || 0; // Add null check

    return acc;
  }, {} as Record<string, number>);

  // Group by provider
  const providerData = vasData.reduce((acc, item) => {
    const name = item.provider.name;

    if (!acc[name]) {
      acc[name] = {
        transactions: 0,
        revenue: 0,
      };
    }

    acc[name].transactions += item.broj_transakcija || 0; // Add null check
    acc[name].revenue += item.fakturisan_iznos || 0; // Add null check

    return acc;
  }, {} as Record<string, { transactions: number; revenue: number; }>);

  // Calculate totals
  const totalTransactions = vasData.reduce((sum, item) => sum + (item.broj_transakcija || 0), 0);
  const totalRevenue = vasData.reduce((sum, item) => sum + (item.fakturisan_iznos || 0), 0);
  const averageTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  // Calculate previous period totals for growth comparison
  const prevTotalTransactions = comparisonData.reduce((sum, item) => sum + (item.broj_transakcija || 0), 0);
  const prevTotalRevenue = comparisonData.reduce((sum, item) => sum + (item.fakturisan_iznos || 0), 0);

  // Calculate growth rates
  // Prevent division by zero if previous period had no activity
  const transactionsGrowth = prevTotalTransactions > 0
    ? ((totalTransactions - prevTotalTransactions) / prevTotalTransactions) * 100
    : (totalTransactions > 0 ? 100 : 0); // If previous was 0 but current > 0, 100% growth. If both 0, 0% growth.

  const revenueGrowth = prevTotalRevenue > 0
    ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100
    : (totalRevenue > 0 ? 100 : 0); // If previous was 0 but current > 0, 100% growth. If both 0, 0% growth.


  // Format data for response

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
    .slice(0, 10); // Top 10 providers

  // REMOVED: revalidatePath("/analytics/sales"); // <--- THIS LINE WAS REMOVED

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