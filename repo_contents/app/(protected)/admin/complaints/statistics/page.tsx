// app/(protected)/admin/complaints/statistics/page.tsx


"use client";

import { useState } from "react";
import { DateRangeFilter } from "@/components/complaints/DateRangeFilter";
import { TrendChart } from "@/components/complaints/charts/TrendChart";
import { StatusChart } from "@/components/complaints/charts/StatusChart";
import { MonthlyComparisonChart } from "@/components/complaints/charts/MonthlyComparisonChart";
import { ServiceCategoryBreakdown } from "@/components/complaints/charts/ServiceCategoryBreakdown";
import { ProviderPerformance } from "@/components/complaints/charts/ProviderPerformance";
import { KpiDashboard } from "@/components/complaints/reports/KpiDashboard";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ComplaintsStatisticsPage() {
  const router = useRouter();
  const [dateRange, setDateRange] = useState<{
    startDate: Date | undefined;
    endDate: Date | undefined;
  }>({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 6)),
    endDate: new Date()
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleDateRangeChange = (startDate: Date | undefined, endDate: Date | undefined) => {
    setDateRange({ startDate, endDate });
    // This would trigger data fetching in a real implementation
  };

  const handleExportData = async () => {
    try {
      setIsLoading(true);
      // In a real implementation, this would call an export API
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      
      // Success notification or download trigger would happen here
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 top-0">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Complaint Statistics & Analytics</h1>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          
          <Button
            variant="outline"
            onClick={handleExportData}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export Data
          </Button>
          
          <Link href="/admin/complaints/reports">
            <Button variant="default">View Reports</Button>
          </Link>
        </div>
      </div>
      
      {isFilterOpen && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter Options</CardTitle>
          </CardHeader>
          <CardContent>
            <DateRangeFilter
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              onChange={handleDateRangeChange}
            />
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 gap-6 mb-6">
        <KpiDashboard />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Complaint Trends</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <TrendChart 
              startDate={dateRange.startDate} 
              endDate={dateRange.endDate} 
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <StatusChart />
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Comparison</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            <MonthlyComparisonChart 
              startDate={dateRange.startDate} 
              endDate={dateRange.endDate}
            />
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Service Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ServiceCategoryBreakdown />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Provider Performance</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ProviderPerformance />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}