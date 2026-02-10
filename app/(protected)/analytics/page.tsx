// app/(protected)/analytics/page.tsx
import { Suspense } from "react";
import { Metadata } from "next";
import { getFinancialData } from "@/actions/analytics/get-financial-data";
import { getSalesMetrics } from "@/actions/analytics/get-sales-metrics";
import { getComplaintStats } from "@/actions/analytics/get-complaint-stats";
import KpiDashboard from "@/components/analytics/KpiDashboard";
import FinancialOverview from "@/components/analytics/FinancialOverview";
import { SalesChart } from "@/components/analytics/SalesChart";
import ComplaintAnalytics from "@/components/analytics/ComplaintAnalytics";
import { DataFilters } from "@/components/analytics/DataFilters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { canAccessAnalyticsPage } from "@/lib/security/permission-checker";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: "Analytics Dashboard",
    description: "Overview of key performance indicators and metrics",
};

export const dynamic = 'force-dynamic';

interface AnalyticsDashboardProps {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
}

// Async komponente za svaki widget - omogućava paralelno učitavanje
async function KpiDashboardWrapper({ filters }: { filters: any }) {
  // Calculate date range for last 3 months
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 3);

  const [financialData, salesData, complaintData] = await Promise.all([
    getFinancialData({ startDate, endDate }),
    getSalesMetrics({ startDate, endDate }),
    getComplaintStats({ startDate, endDate })
  ]);

  return (
    <KpiDashboard
      financialData={financialData}
      salesData={salesData}
      complaintData={complaintData}
    />
  );
}

async function FinancialOverviewWrapper() {
  // Calculate date range for last 3 months
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 3);
  
  try {
    const data = await getFinancialData({ startDate, endDate });
    return <FinancialOverview data={data} />;
  } catch (error) {
    // If FinancialOverview expects error prop, pass it here
    return <FinancialOverview data={null} />;
  }
}

async function ComplaintAnalyticsWrapper() {
  // Calculate date range for last 3 months
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 3);
  
  try {
    const data = await getComplaintStats({ startDate, endDate });
    return <ComplaintAnalytics data={data} isLoading={false} error={null} />;
  } catch (error) {
    return <ComplaintAnalytics data={null} isLoading={false} error={error instanceof Error ? error.message : 'Failed to load complaint data'} />;
  }
}

export default async function AnalyticsDashboard({ searchParams }: AnalyticsDashboardProps) {
    // Provera dozvola - ovo može biti brzo
    const canAccess = await canAccessAnalyticsPage();
    if (!canAccess) {
        redirect('/');
    }

    const resolvedSearchParams = await searchParams;

    function getFirstValue(value: string | string[] | undefined): string | undefined {
        return Array.isArray(value) ? value[0] : value;
    }

    const filters = {
        period: getFirstValue(resolvedSearchParams?.period) || 'monthly',
        dateRange: {
            from: getFirstValue(resolvedSearchParams?.dateFrom) ? new Date(getFirstValue(resolvedSearchParams?.dateFrom)!) : null,
            to: getFirstValue(resolvedSearchParams?.dateTo) ? new Date(getFirstValue(resolvedSearchParams?.dateTo)!) : null,
        },
        providerIds: getFirstValue(resolvedSearchParams?.providers) ? getFirstValue(resolvedSearchParams?.providers)!.split(',') : [],
        serviceTypes: getFirstValue(resolvedSearchParams?.serviceTypes) ? getFirstValue(resolvedSearchParams?.serviceTypes)!.split(',') : [],
        productIds: getFirstValue(resolvedSearchParams?.products) ? getFirstValue(resolvedSearchParams?.products)!.split(',') : [],
        searchQuery: getFirstValue(resolvedSearchParams?.q) || '',
    };

    return (
        <div className="container mx-auto py-8 space-y-8">
            {/* Ovo se prikazuje odmah - statički sadržaj */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
                <p className="text-muted-foreground">
                    Monitor performance metrics and business insights
                </p>
            </div>

            {/* Filteri - mogu biti immediately visible */}
            <div className="w-full">
                <Suspense fallback={<Skeleton className="h-10 w-full" />}>
                    <DataFilters initialFilters={filters} />
                </Suspense>
            </div>

            {/* KPI Dashboard - učitava se nezavisno */}
            <Suspense fallback={<KpiSkeleton />}>
                <KpiDashboardWrapper filters={filters} />
            </Suspense>

            {/* Tabs sa odvojenim suspense granicama */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="financials">Financials</TabsTrigger>
                    <TabsTrigger value="sales">Sales</TabsTrigger>
                    <TabsTrigger value="complaints">Complaints</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {/* Svaki chart se učitava nezavisno */}
                        <Suspense fallback={<ChartSkeleton />}>
                            <FinancialOverviewWrapper />
                        </Suspense>

                        <Suspense fallback={<ChartSkeleton />}>
                            <SalesChart filters={filters} />
                        </Suspense>

                        <Suspense fallback={<ChartSkeleton />}>
                            <ComplaintAnalyticsWrapper />
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