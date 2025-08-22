// components/complaints/reports/KpiDashboard.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusChart } from "@/components/complaints/charts/StatusChart";
import { TrendChart } from "@/components/complaints/charts/TrendChart";
import { MonthlyComparisonChart } from "@/components/complaints/charts/MonthlyComparisonChart";
import { ServiceCategoryBreakdown } from "@/components/complaints/charts/ServiceCategoryBreakdown";
import { ProviderPerformance } from "@/components/complaints/charts/ProviderPerformance";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRange } from "@/components/ui/date-range";
import { Button } from "@/components/ui/button";
import { Loader2, FileDown } from "lucide-react";
import { ComplaintStatus, ServiceType } from "@/lib/types/enums";
import { format, addDays, subDays, subMonths } from "date-fns";

interface KpiDashboardProps {
  onExport?: () => void;
}

export function KpiDashboard({ onExport }: KpiDashboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: subMonths(new Date(), 1),
    to: new Date(),
  });
  const [activeTab, setActiveTab] = useState<"overview" | "services" | "providers">("overview");

  const [statusData, setStatusData] = useState<{ status: ComplaintStatus; count: number }[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [serviceData, setServiceData] = useState<any[]>([]);
  const [providerData, setProviderData] = useState<any[]>([]);
  const [overviewData, setOverviewData] = useState<{
      totalComplaints: number;
      openComplaints: number;
      avgResolutionTime: string; // Primer stringa, prilagodite tipu koji API vraća
      resolutionRate: string; // Primer stringa, prilagodite tipu koji API vraća
  } | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);

      try {
        const fromDate = dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : '';
        const toDate = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : '';
        const response = await fetch(`/api/complaints/statistics?from=${fromDate}&to=${toDate}`);

        if (!response.ok) {
             const errorBody = await response.json();
            throw new Error(errorBody.error || "Failed to fetch complaints statistics");
        }

        const data = await response.json();

        setStatusData(data.statusData || []);
        setTrendData(data.trendData || []);
        setServiceData(data.serviceData || []);
        setProviderData(data.providerData || []);
        setOverviewData(data.overviewData || null); // Pretpostavljamo da API vraća i ove podatke

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [dateRange]);

  const handleExport = () => {
    if (onExport) {
      onExport();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <DateRange
            dateRange={dateRange}
            onUpdate={setDateRange}
          />

          <Button
            variant="outline"
            onClick={handleExport}
            disabled={isLoading}
          >
            <FileDown className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "overview" | "services" | "providers")}
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : overviewData?.totalComplaints ?? 'N/A'}
                </div>
                {/* Prikazivanje promena iz prethodnog perioda zahteva dodatne podatke iz API-ja */}
                {/* <p className="text-xs text-muted-foreground">+12% from previous period</p> */}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Open Complaints</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : overviewData?.openComplaints ?? 'N/A'}
                </div>
                 {/* Prikazivanje promena iz prethodnog perioda zahteva dodatne podatke iz API-ja */}
                {/* <p className="text-xs text-muted-foreground">-3% from previous period</p> */}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg. Resolution Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                   {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : overviewData?.avgResolutionTime ?? 'N/A'}
                </div>
                 {/* Prikazivanje promena iz prethodnog perioda zahteva dodatne podatke iz API-ja */}
                {/* <p className="text-xs text-muted-foreground">-0.5 days from previous period</p> */}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                   {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : overviewData?.resolutionRate ?? 'N/A'}
                </div>
                 {/* Prikazivanje promena iz prethodnog perioda zahteva dodatne podatke iz API-ja */}
                {/* <p className="text-xs text-muted-foreground">+2.5% from previous period</p> */}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TrendChart
              data={trendData}
              isLoading={isLoading}
              title="Complaint Trends"
            />

            <StatusChart
              data={statusData}
              isLoading={isLoading}
              title="Complaints by Status"
            />
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ServiceCategoryBreakdown
              data={serviceData}
              isLoading={isLoading}
              title="Complaints by Service Category"
            />

            <MonthlyComparisonChart
              isLoading={isLoading} // Pretpostavljamo da ova komponenta fecthuje sama ili prima samo loading state
              title="Complaints by Service Type (Monthly)" // Ova komponenta verovatno treba da dobije i podatke
            />
          </div>
        </TabsContent>

        <TabsContent value="providers" className="space-y-6 mt-6">
          <ProviderPerformance
            data={providerData}
            isLoading={isLoading}
            title="Complaints by Provider"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}