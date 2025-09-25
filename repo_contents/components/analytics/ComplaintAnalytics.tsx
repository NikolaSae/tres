// components/analytics/ComplaintAnalytics.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { ComplaintStatus } from "@prisma/client";
import { ComplaintStats } from "@/actions/analytics/get-complaint-stats";


interface ComplaintAnalyticsProps {
    data: ComplaintStats;
    isLoading: boolean;
    error: any;
}


const STATUS_COLORS = {
    NEW: "#4299e1",
    ASSIGNED: "#805ad5",
    IN_PROGRESS: "#f6ad55",
    PENDING: "#f6e05e",
    RESOLVED: "#68d391",
    CLOSED: "#38a169",
    REJECTED: "#e53e3e"
};

const PRIORITY_COLORS = ["#e53e3e", "#dd6b20", "#ecc94b", "#38a169", "#3182ce"];

function safeArray(arr: any): any[] {
    return Array.isArray(arr) ? arr : [];
}


export default function ComplaintAnalytics({ data, isLoading, error }: ComplaintAnalyticsProps) {
    const totalComplaints = data?.totalComplaints ?? 0;
    const resolvedComplaints = data?.resolvedComplaints ?? 0;
    const openComplaints = data?.openComplaints ?? 0;
    const averageResolutionTime = data?.averageResolutionTime ?? 0;
    const statusDistribution = safeArray(data?.complaintsByStatus);
    const monthlyData = safeArray(data?.complaintsByMonth);
    const serviceDistribution = safeArray(data?.complaintsByService);
    const providerDistribution = safeArray(data?.complaintsByProvider);
    const highPriorityComplaints = data?.highPriorityComplaints ?? 0;
    const financialImpact = data?.financialImpact ?? 0;


    const formattedMonthlyDataForChart = monthlyData.map(item => ({
        date: item.month,
        Total: item.total,
        Resolved: item.resolved,
    }));

    const resolutionTimeAvgByServiceType = safeArray(data?.complaintsByProvider);


    if (error) {
        return (
            <Card className="col-span-full">
                <CardHeader>
                    <CardTitle>Complaint Analytics</CardTitle>
                    <CardDescription>Error loading complaint data</CardDescription>
                </CardHeader>
                <CardContent className="text-red-500">
                    Failed to load complaint analytics. Please try again later.
                </CardContent>
            </Card>
        );
    }

    if (isLoading && !data) {
        return <Skeleton className="h-[500px] w-full col-span-full" />;
    }


    return (
        <Card className="col-span-full">
            <CardHeader>
                <CardTitle>Complaint Analytics</CardTitle>
                <CardDescription>Complaints trends and statistics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Average Resolution Time</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{averageResolutionTime.toFixed(1)} days</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">High Priority Complaints</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{highPriorityComplaints.toString()}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Open Complaints</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{openComplaints.toString()}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Financial Impact</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{financialImpact.toFixed(2)} €</div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Complaint Trends</CardTitle>
                            <CardDescription>New vs Resolved complaints over time</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={formattedMonthlyDataForChart}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="Total" stroke="#4299e1" name="Total New" />
                                        <Line type="monotone" dataKey="Resolved" stroke="#38a169" name="Resolved" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Status Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={statusDistribution}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="status" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="count" name="Complaints">
                                            {statusDistribution.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS] || "#000"}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Service Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={serviceDistribution}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="serviceName" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="count" name="Complaints" fill="#8884d8" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Complaints by Provider (Top)</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={providerDistribution}
                                        layout="vertical"
                                         margin={{ left: 120 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" />
                                        <YAxis type="category" dataKey="providerName" width={120} tick={{ fontSize: 12 }} />
                                        <Tooltip formatter={(value, name) => [`${value} complaints`, name === 'count' ? 'Total' : 'Resolved']} />
                                        <Legend />
                                        <Bar dataKey="count" name="Total" fill="#8884d8" />
                                         <Bar dataKey="resolvedCount" name="Resolved" fill="#38a169" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </CardContent>
        </Card>
    );
}