// components/analytics/ParkingFinancialOverview.tsx

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
import { LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ParkingFinancialMetrics } from "@/app/(protected)/analytics/financials/actions";
import { formatCurrency } from "@/lib/formatters";

function safeArray(arr: any): any[] {
    return Array.isArray(arr) ? arr : [];
}

interface ParkingFinancialOverviewProps {
    data: ParkingFinancialMetrics;
}

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function ParkingFinancialOverview({ data }: ParkingFinancialOverviewProps) {
    const monthlyData = safeArray(data?.revenueByMonth);
    const parkingServiceData = safeArray(data?.parkingServiceBreakdown);
    const groupData = safeArray(data?.groupBreakdown);

    const totalAmount = data?.totalAmount || 0;
    const totalQuantity = data?.totalQuantity || 0;
    const averagePrice = data?.averagePrice || 0;

    const formattedMonthlyDataForChart = monthlyData.map(item => ({
        date: item.month,
        Amount: item.amount,
        Quantity: item.quantity,
    }));

    const chartColors = {
        amount: "#4f46e5",
        quantity: "#10b981",
    };

    return (
        <Card className="col-span-full">
            <CardHeader>
                <CardTitle>Parking Financial Overview</CardTitle>
                <CardDescription>
                    Overview of parking service financial metrics
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Revenue
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(totalAmount)}
                            </div>
                            <CardDescription className="mt-2 text-xs">
                                Total parking revenue in the period
                            </CardDescription>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Transactions
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {totalQuantity.toLocaleString()}
                            </div>
                            <CardDescription className="mt-2 text-xs">
                                Total number of parking transactions
                            </CardDescription>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Average Price
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(averagePrice)}
                            </div>
                            <CardDescription className="mt-2 text-xs">
                                Average price per transaction
                            </CardDescription>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts */}
                <Tabs defaultValue="monthly">
                    <TabsList>
                        <TabsTrigger value="monthly">Monthly Performance</TabsTrigger>
                        <TabsTrigger value="services">Parking Services</TabsTrigger>
                        <TabsTrigger value="groups">Payment Groups</TabsTrigger>
                    </TabsList>

                    {/* Monthly Performance */}
                    <TabsContent value="monthly" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Monthly Parking Performance</CardTitle>
                                <CardDescription>
                                    Revenue and transaction volume over time
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={formattedMonthlyDataForChart}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis yAxisId="left" />
                                            <YAxis yAxisId="right" orientation="right" />
                                            <Tooltip 
                                                formatter={(value, name) => {
                                                    if (name === "Amount") {
                                                        return formatCurrency(value as number);
                                                    }
                                                    return (value as number).toLocaleString();
                                                }} 
                                            />
                                            <Legend />
                                            <Line
                                                yAxisId="left"
                                                type="monotone"
                                                dataKey="Amount"
                                                stroke={chartColors.amount}
                                                name="Revenue"
                                                strokeWidth={2}
                                            />
                                            <Line
                                                yAxisId="right"
                                                type="monotone"
                                                dataKey="Quantity"
                                                stroke={chartColors.quantity}
                                                name="Transactions"
                                                strokeWidth={2}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Parking Services Breakdown */}
                    <TabsContent value="services" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Revenue by Parking Service</CardTitle>
                                <CardDescription>
                                    Revenue distribution across parking services
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={parkingServiceData}
                                            layout="vertical"
                                            margin={{ left: 120 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" />
                                            <YAxis
                                                type="category"
                                                dataKey="serviceName"
                                                width={120}
                                                tick={{ fontSize: 12 }}
                                            />
                                            <Tooltip formatter={(value) => formatCurrency(value as number)} />
                                            <Bar
                                                dataKey="amount"
                                                fill={chartColors.amount}
                                                name="Revenue"
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Payment Groups Breakdown */}
                    <TabsContent value="groups" className="mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Pie Chart */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Revenue by Payment Group</CardTitle>
                                    <CardDescription>
                                        Distribution between prepaid and postpaid
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={groupData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ group, percentage }) => 
                                                        `${group}: ${percentage.toFixed(1)}%`
                                                    }
                                                    outerRadius={100}
                                                    fill="#8884d8"
                                                    dataKey="amount"
                                                    nameKey="group"
                                                >
                                                    {groupData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Bar Chart */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Payment Group Details</CardTitle>
                                    <CardDescription>
                                        Revenue comparison by payment type
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={groupData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="group" />
                                                <YAxis />
                                                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                                                <Bar dataKey="amount" fill={chartColors.amount} name="Revenue">
                                                    {groupData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}