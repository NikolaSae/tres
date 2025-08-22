// /components/analytics/FinancialOverview.tsx

"use client";

import { useMemo } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { FinancialMetrics } from "@/actions/analytics/get-financial-data";
import { formatCurrency } from "@/lib/formatters";

function safeArray(arr: any): any[] {
    return Array.isArray(arr) ? arr : [];
}

interface FinancialOverviewProps {
    data: FinancialMetrics;
}

export default function FinancialOverview({ data }: FinancialOverviewProps) {
    const monthlyData = safeArray(data?.revenueByMonth);
    const providerRevenueData = safeArray(data?.providerBreakdown);
    const serviceTypeRevenueData = safeArray(data?.serviceTypeBreakdown);

    const totalRevenue = useMemo(() => {
        return monthlyData.reduce((sum, item) => sum + (item.revenue ?? 0), 0);
    }, [monthlyData]);

    const totalCollected = useMemo(() => {
         return monthlyData.reduce((sum, item) => sum + (item.collected ?? 0), 0);
     }, [monthlyData]);

     const totalOutstanding = useMemo(() => {
         return monthlyData.reduce((sum, item) => sum + (item.outstanding ?? 0), 0);
     }, [monthlyData]);


     const totalProfit = useMemo(() => {
        return totalRevenue;
     }, [totalRevenue]);

    const averageProfit = useMemo(() => {
        return monthlyData.length > 0 ? totalProfit / monthlyData.length : 0;
    }, [totalProfit, monthlyData]);

    const topProviders = useMemo(() => {
         return providerRevenueData.slice(0, 10);
    }, [providerRevenueData]);

    const topServices = useMemo(() => {
        return serviceTypeRevenueData
            .sort((a, b) => (b.revenue ?? 0) - (a.revenue ?? 0));
    }, [serviceTypeRevenueData]);


    const chartColors = {
        revenue: "#4f46e5",
        expenses: "#f43f5e",
        profit: "#10b981",
        thisYear: "#8b5cf6",
        lastYear: "#a3a3a3",
    };

     const formattedMonthlyDataForChart = monthlyData.map(item => ({
         date: item.month,
         Revenue: item.revenue,
         Collected: item.collected,
         Outstanding: item.outstanding,
     }));


    return (
        <Card className="col-span-full">
            <CardHeader>
                <CardTitle>Financial Overview</CardTitle>
                <CardDescription>
                    Overview of key financial metrics
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Revenue
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(totalRevenue)}
                            </div>
                            <CardDescription className="mt-2 text-xs">
                                Cumulative revenue in the period
                            </CardDescription>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Collected
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(totalCollected)}
                            </div>
                            <CardDescription className="mt-2 text-xs">
                                Cumulative collected amount
                            </CardDescription>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Outstanding
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(totalOutstanding)}
                            </div>
                            <CardDescription className="mt-2 text-xs">
                                Cumulative outstanding amount
                            </CardDescription>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="monthly">
                    <TabsList>
                        <TabsTrigger value="monthly">Monthly Performance</TabsTrigger>
                        <TabsTrigger value="providers">Provider Revenue</TabsTrigger>
                        <TabsTrigger value="services">Service Revenue</TabsTrigger>
                    </TabsList>

                    <TabsContent value="monthly" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Monthly Financial Performance</CardTitle>
                                <CardDescription>
                                    Revenue, collected, and outstanding amounts over the period
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={formattedMonthlyDataForChart}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <Tooltip formatter={(value) => formatCurrency(value as number)} />
                                            <Legend />
                                            <Line
                                                type="monotone"
                                                dataKey="Revenue"
                                                stroke={chartColors.revenue}
                                                name="Revenue"
                                                strokeWidth={2}
                                            />
                                             <Line
                                                type="monotone"
                                                dataKey="Collected"
                                                stroke={chartColors.profit}
                                                name="Collected"
                                                strokeWidth={2}
                                            />
                                             <Line
                                                type="monotone"
                                                dataKey="Outstanding"
                                                stroke={chartColors.expenses}
                                                name="Outstanding"
                                                strokeWidth={2}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="providers" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Provider Revenue Breakdown (Top 10)</CardTitle>
                                <CardDescription>
                                    Revenue distribution across top providers
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={topProviders}
                                            layout="vertical"
                                            margin={{ left: 120 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" formatter={(value) => formatCurrency(value as number)} />
                                            <YAxis
                                                type="category"
                                                dataKey="providerName"
                                                width={120}
                                                tick={{ fontSize: 12 }}
                                            />
                                            <Tooltip formatter={(value) => formatCurrency(value as number)} />
                                            <Bar
                                                dataKey="revenue"
                                                fill={chartColors.revenue}
                                                name="Revenue"
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="services" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Service Revenue Breakdown (by Type)</CardTitle>
                                <CardDescription>
                                    Revenue distribution across service types
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={topServices}
                                            layout="vertical"
                                            margin={{ left: 120 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" formatter={(value) => formatCurrency(value as number)} />
                                            <YAxis
                                                type="category"
                                                dataKey="serviceType"
                                                width={120}
                                                tick={{ fontSize: 12 }}
                                            />
                                            <Tooltip formatter={(value) => formatCurrency(value as number)} />
                                            <Legend />
                                            <Bar
                                                dataKey="revenue"
                                                fill={chartColors.thisYear}
                                                name="Revenue"
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}