// app/(protected)/admin/complaints/statistics/page.tsx

"use client";

import { useState, useEffect } from "react";
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
import { Complaint, Provider } from "@prisma/client";
import { ComplaintStatus } from "@/lib/types/enums";

// Types for chart data
interface TrendDataPoint {
  date: string;
  new: number;
  resolved: number;
  closed: number;
  total: number;
}

interface StatusData {
  status: ComplaintStatus;
  count: number;
}

type ComplaintWithProvider = Complaint & {
  provider?: Provider | null;
};

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
  const [isDataLoading, setIsDataLoading] = useState(true);
  
  // State for chart data
  const [complaints, setComplaints] = useState<ComplaintWithProvider[]>([]);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [statusData, setStatusData] = useState<StatusData[]>([]);

  // Fetch data on mount and when date range changes
  useEffect(() => {
    const fetchData = async () => {
      setIsDataLoading(true);
      try {
        // In a real implementation, fetch data from API
        // const response = await fetch(`/api/complaints/statistics?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
        // const data = await response.json();
        
        // For now, using mock data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock complaints data
        const mockComplaints: ComplaintWithProvider[] = [];
        
        // Mock trend data
        const mockTrendData: TrendDataPoint[] = Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          new: Math.floor(Math.random() * 20) + 5,
          resolved: Math.floor(Math.random() * 15) + 3,
          closed: Math.floor(Math.random() * 10) + 2,
          total: Math.floor(Math.random() * 50) + 20,
        }));
        
        // Mock status data
        const mockStatusData: StatusData[] = [
          { status: ComplaintStatus.NEW, count: 45 },
          { status: ComplaintStatus.ASSIGNED, count: 32 },
          { status: ComplaintStatus.IN_PROGRESS, count: 78 },
          { status: ComplaintStatus.PENDING, count: 23 },
          { status: ComplaintStatus.RESOLVED, count: 145 },
          { status: ComplaintStatus.CLOSED, count: 98 },
          { status: ComplaintStatus.REJECTED, count: 12 },
        ];
        
        setComplaints(mockComplaints);
        setTrendData(mockTrendData);
        setStatusData(mockStatusData);
      } catch (error) {
        console.error("Failed to fetch statistics:", error);
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchData();
  }, [dateRange.startDate, dateRange.endDate]);

  const handleDateRangeChange = (startDate: Date | undefined, endDate: Date | undefined) => {
    setDateRange({ startDate, endDate });
  };

  const handleExportData = async () => {
    try {
      setIsLoading(true);
      // In a real implementation, this would call an export API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
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
        <TrendChart 
          data={trendData}
          isLoading={isDataLoading}
          period="month"
        />
        
        <StatusChart 
          data={statusData}
          isLoading={isDataLoading}
        />
      </div>
      
      <div className="grid grid-cols-1 gap-6 mb-6">
        <MonthlyComparisonChart 
          complaints={complaints}
          monthsToShow={6}
          height={350}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ServiceCategoryBreakdown />
        
        <ProviderPerformance 
          complaints={complaints}
          maxProviders={10}
        />
      </div>
    </div>
  );
}