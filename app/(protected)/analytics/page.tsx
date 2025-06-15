///app/(protected)/analytics/page.tsx

import { Suspense } from "react";
import { Metadata } from "next";
import { getFinancialData } from "@/actions/analytics/get-financial-data";
import { getSalesMetrics } from "@/actions/analytics/get-sales-metrics";
import { getComplaintStats } from "@/actions/analytics/get-complaint-stats";
import KpiDashboard from "@/components/analytics/KpiDashboard";
import FinancialOverview from "@/components/analytics/FinancialOverview";
// FIX: Import SalesChart as a named export
import { SalesChart } from "@/components/analytics/SalesChart";
import ComplaintAnalytics from "@/components/analytics/ComplaintAnalytics";
// FIX: Import DataFilters as a named export
import { DataFilters } from "@/components/analytics/DataFilters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

// Optional: Import permission checker helper for page access
import { canAccessAnalyticsPage } from "@/lib/security/permission-checker";
import { redirect } from "next/navigation";


export const metadata: Metadata = {
    title: "Analytics Dashboard",
    description: "Overview of key performance indicators and metrics",
};

// Add types for initial data if available, helps with KpiDashboard props
// interface AnalyticsPageProps {
//     // Define types for initial data
// }


export default async function AnalyticsDashboard(/* props: AnalyticsPageProps */) {

    // Optional: Check if the user has permission to access the page
    const canAccess = await canAccessAnalyticsPage();
    if (!canAccess) {
        // Redirect to access denied or home page if not allowed
         redirect('/'); // Or '/access-denied'
    }


    // For initial data load - prefetch on the server
    const initialFinancialData = await getFinancialData({
        period: "monthly",
        months: 3
    });

    const initialSalesData = await getSalesMetrics({
        period: "monthly",
        months: 3
    });

    const initialComplaintData = await getComplaintStats({
        period: "monthly",
        months: 3
    });

    return (
        <div className="flex flex-col gap-5 container mx-auto py-8 top-0">
        {/* Title section */}
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground">
                Monitor performance metrics and business insights
            </p>
        </div>

        {/* Moved filter below title with responsive width */}
        <div className="w-full max-w-2xl"> {/* Added width constraint */}
            <Suspense fallback={<Skeleton className="h-10 w-full" />}>
                <DataFilters />
            </Suspense>
        </div>

            <Suspense fallback={<KpiSkeleton />}>
                <KpiDashboard
                    financialData={initialFinancialData}
                    salesData={initialSalesData}
                    complaintData={initialComplaintData}
                />
            </Suspense>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="financials">Financials</TabsTrigger>
                    <TabsTrigger value="sales">Sales</TabsTrigger>
                    <TabsTrigger value="complaints">Complaints</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                         {/* Assuming FinancialOverview is a Client Component */}
                        <Suspense fallback={<ChartSkeleton />}>
                            <FinancialOverview data={initialFinancialData} />
                        </Suspense>

                        {/* Assuming SalesChart is a Client Component */}
                        <Suspense fallback={<ChartSkeleton />}>
                            <SalesChart data={initialSalesData} />
                        </Suspense>

                         {/* Assuming ComplaintAnalytics is a Client Component */}
                        <Suspense fallback={<ChartSkeleton />}>
                            <ComplaintAnalytics data={initialComplaintData} />
                        </Suspense>
                    </div>
                </TabsContent>

                <TabsContent value="financials" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Financial Performance</CardTitle>
                            <CardDescription>
                                Revenue, expenses, and key financial metrics
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                For detailed financial analytics, go to the
                                <a href="/analytics/financials" className="font-medium underline pl-1">
                                    Financial Analytics
                                </a> page.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="sales" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Sales Performance</CardTitle>
                            <CardDescription>
                                Services sold, conversion rates, and revenue by service type
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                For detailed sales analytics, go to the
                                <a href="/analytics/sales" className="font-medium underline pl-1">
                                    Sales Analytics
                                </a> page.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="complaints" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Complaint Analytics</CardTitle>
                            <CardDescription>
                                Complaint volume, resolution time, and customer satisfaction metrics
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                For detailed complaint analytics, go to the
                                <a href="/analytics/complaints" className="font-medium underline pl-1">
                                    Complaint Analytics
                                </a> page.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function KpiSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
                <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            <Skeleton className="h-4 w-20" />
                        </CardTitle>
                        <Skeleton className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-10 w-24" />
                        <Skeleton className="h-4 w-[60%] mt-4" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function ChartSkeleton() {
    return (
        <Card>
            <CardHeader>
                <CardTitle><Skeleton className="h-6 w-[50%]" /></CardTitle>
            </CardHeader>
            <CardContent>
                <Skeleton className="h-[300px] w-full" />
            </CardContent>
        </Card>
    );
}