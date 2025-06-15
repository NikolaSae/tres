///components/analytics/SalesChart.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  BarChart,
  Bar
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSalesData } from "@/hooks/use-sales-data";
import { Loader2 } from "lucide-react";
import { DataFilterOptions } from "./DataFilters";

export type SalesPeriod = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";

interface SalesDataPoint {
  date: string;
  revenue: number;
  transactions: number;
  providerName?: string;
  serviceName?: string;
  serviceType?: string;
  period?: string;
  collected?: number;
  uncollected?: number;
}

interface SalesMetrics {
  totalRevenue: number;
  totalTransactions: number;
  averageTransactionValue: number;
  growthRate: number;
  topProviders: { name: string; revenue: number; transactions: number }[];
  topServices: { name: string; revenue: number; transactions: number }[];
}

const chartColors = {
  transactions: "#4f46e5",
  revenue: "#0ea5e9",
  collected: "#10b981",
  uncollected: "#f43f5e",
};

interface SalesChartProps {
    filters: DataFilterOptions & { period: string };
}

export function SalesChart({ filters }: SalesChartProps) {
  const router = useRouter();

  // Add check for filters being undefined
  if (!filters) {
      console.error("Filters prop is undefined in SalesChart");
      return <div>Error loading sales chart data.</div>;
  }

  const period = (filters.period || "monthly") as SalesPeriod;

  const {
      salesData,
      metrics,
      isLoading,
      error
    } = useSalesData(
      period,
      filters.dateRange?.from,
      filters.dateRange?.to,
      filters.serviceTypes && filters.serviceTypes.length > 0 ? filters.serviceTypes[0] : undefined, // Safely access first element
      filters.providerIds && filters.providerIds.length > 0 ? filters.providerIds[0] : undefined // Safely access first element
    );

  if (isLoading) {
    return (
      <Card className="w-full h-96">
        <CardHeader>
          <CardTitle>Sales Performance</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-72">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error || !salesData) {
    return (
      <Card className="w-full h-96">
        <CardHeader>
          <CardTitle>Sales Performance</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-72">
          <p className="text-muted-foreground">Failed to load sales data</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = salesData;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Sales Performance</CardTitle>
         <Tabs
           value={period}
           onValueChange={(value) => {
             const params = new URLSearchParams(window.location.search);
             params.set('period', value);
             router.push(`${window.location.pathname}?${params.toString()}`);
           }}
           className="w-fit"
         >
           <TabsList>
             <TabsTrigger value="monthly">Monthly</TabsTrigger>
             <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
             <TabsTrigger value="yearly">Yearly</TabsTrigger>
           </TabsList>
         </Tabs>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="line" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="line">Line Chart</TabsTrigger>
            <TabsTrigger value="bar">Bar Chart</TabsTrigger>
          </TabsList>
          <TabsContent value="line" className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis />
                <Tooltip
                  formatter={(value) => [`${Number(value).toLocaleString()}`, ""]}
                  labelFormatter={(label) => `Period: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="transactions"
                  stroke={chartColors.transactions}
                  name="Transactions"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke={chartColors.revenue}
                  name="Revenue"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="collected"
                  stroke={chartColors.collected}
                  name="Collected"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="uncollected"
                  stroke={chartColors.uncollected}
                  name="Uncollected"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
          <TabsContent value="bar" className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                   dataKey="period"
                   tick={{ fontSize: 12 }}
                   angle={-45}
                   textAnchor="end"
                   height={60}
                 />
                <YAxis />
                <Tooltip
                  formatter={(value) => [`${Number(value).toLocaleString()}`, ""]}
                  labelFormatter={(label) => `Period: ${label}`}
                />
                <Legend />
                <Bar dataKey="revenue" fill={chartColors.revenue} name="Revenue" />
                <Bar dataKey="collected" fill={chartColors.collected} name="Collected" />
                <Bar dataKey="uncollected" fill={chartColors.uncollected} name="Uncollected" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}