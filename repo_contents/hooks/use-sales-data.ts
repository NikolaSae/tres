// hooks/use-sales-data.ts
"use client";

import { useState, useEffect } from "react";

export type SalesPeriod = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";

interface SalesDataPoint {
  date: string;
  revenue: number;
  transactions: number;
  providerName?: string;
  serviceName?: string;
  serviceType?: string;
}

interface SalesMetrics {
  totalRevenue: number;
  totalTransactions: number;
  averageTransactionValue: number;
  growthRate: number;
  topProviders: { name: string; revenue: number; transactions: number }[];
  topServices: { name: string; revenue: number; transactions: number }[];
}

export function useSalesData(
  period: SalesPeriod = "monthly",
  startDate?: Date,
  endDate?: Date,
  serviceType?: string,
  providerId?: string
) {
  const [salesData, setSalesData] = useState<SalesDataPoint[]>([]);
  const [metrics, setMetrics] = useState<SalesMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        setIsLoading(true);

        const params = new URLSearchParams();
        if (period) params.append("period", period);
        if (startDate) params.append("startDate", startDate.toISOString());
        if (endDate) params.append("endDate", endDate.toISOString());
        if (serviceType) params.append("serviceType", serviceType);
        if (providerId) params.append("providerId", providerId);

        // CORRECTED: Use the correct API route /api/analytics/sales
        const dataResponse = await fetch(`/api/analytics/sales?${params.toString()}`);

        if (!dataResponse.ok) {
          throw new Error(`Error fetching sales data: ${dataResponse.statusText}`);
        }

        const data = await dataResponse.json();
        setSalesData(data.salesData || []);

        const totalRevenue = (data.salesData || []).reduce((sum: number, item: SalesDataPoint) => sum + item.revenue, 0);
        const totalTransactions = (data.salesData || []).reduce((sum: number, item: SalesDataPoint) => sum + item.transactions, 0);

        setMetrics({
          totalRevenue,
          totalTransactions,
          averageTransactionValue: totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
          growthRate: data.growthRate || 0,
          topProviders: data.topProviders || [],
          topServices: data.topServices || []
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error("Error fetching sales data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalesData();
  }, [period, startDate, endDate, serviceType, providerId]);

  return {
    salesData,
    metrics,
    isLoading,
    error
  };
}