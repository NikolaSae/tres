// components/analytics/VasFinancialOverview.tsx

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
import { FinancialMetrics } from "@/app/(protected)/analytics/financials/actions";
import { formatCurrency } from "@/lib/formatters";

function safeArray(arr: any): any[] {
    return Array.isArray(arr) ? arr : [];
}

interface VasFinancialOverviewProps {
    data: FinancialMetrics;
}

export default function VasFinancialOverview({ data }: VasFinancialOverviewProps) {
    const monthlyData = safeArray(data?.revenueByMonth);
    const providerRevenueData = safeArray(data?.providerBreakdown);
    const serviceTypeRevenueData = safeArray(data?.serviceTypeBreakdown);

    const totalRevenue = data?.totalRevenue || 0;
    const totalCollected = data?.collectedAmount || 0;
    const totalOutstanding = data?.outstandingAmount || 0;
    const totalCanceled = data?.canceledAmount || 0;

    const formattedMonthlyDataForChart = monthlyData.map(item => ({
        date: item.month,
        Revenue: item.revenue,
        Collected: item.collected,
        Outstanding: item.outstanding,
    }));

    const chartColors = {
        revenue: "#4f46e5",
        collected: "#10b981",
        outstanding: "#f43f5e",
        canceled: "#f59e0b",
    };

    return (
        <Card className="col-span-full">
            <CardHeader>
                <CardTitle>VAS Financial Overview</CardTitle>
                <CardDescription>
                    Overview of VAS (Value Added Services) financial metrics
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                                Cumulative VAS revenue
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
                            <div className="text-2xl font-bold text-green-600">
                                {formatCurrency(totalCollected)}
                            </div>
                            <CardDescription className="mt-2 text-xs">
                                Successfully collected amount
                            </CardDescription>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Outstanding
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {formatCurrency(totalOutstanding)}
                            </div>
                            <CardDescription className="mt-2 text-xs">
                                Pending collection
                            </CardDescription>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Canceled
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">
                                {formatCurrency(totalCanceled)}
                            </div>
                            <CardDescription className="mt-2 text-xs">
                                Canceled transactions
                            </CardDescription>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts */}
                <Tabs defaultValue="monthly">
                    <TabsList>
                        <TabsTrigger value="monthly">Monthly Performance</TabsTrigger>
                        <TabsTrigger value="providers">Provider Revenue</TabsTrigger>
                        <TabsTrigger value="services">Service Types</TabsTrigger>
                    </TabsList>

                    {/* Monthly Performance */}
                    <TabsContent value="monthly" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Monthly VAS Financial Performance</CardTitle>
                                <CardDescription>
                                    Revenue, collected, and outstanding amounts over time
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
                                                stroke={chartColors.collected}
                                                name="Collected"
                                                strokeWidth={2}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="Outstanding"
                                                stroke={chartColors.outstanding}
                                                name="Outstanding"
                                                strokeWidth={2}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Provider Revenue */}
                    <TabsContent value="providers" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Provider Revenue Breakdown (Top 10)</CardTitle>
                                <CardDescription>
                                    Revenue distribution across top VAS providers
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={providerRevenueData}
                                            layout="vertical"
                                            margin={{ left: 120 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" />
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

                    {/* Service Types */}
                    <TabsContent value="services" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Service Type Revenue Breakdown</CardTitle>
                                <CardDescription>
                                    Revenue distribution across VAS service types
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={serviceTypeRevenueData}
                                            layout="vertical"
                                            margin={{ left: 120 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" />
                                            <YAxis
                                                type="category"
                                                dataKey="serviceType"
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
                </Tabs>
            </CardContent>
        </Card>
    );
}