//app/(protected)/parking-services/[id]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { 
  getParkingServiceById,
  getContractsCountForParkingService,
  getServicesCountForParkingService,
  getActiveContractsCount,
  getTotalParkingRevenue,
  getAvgDailyParkingRevenue,
  getParkingServiceStats,
  getMonthlyRevenueStats
} from "@/actions/parking-services";
import ParkingServiceDetails from "@/components/parking-services/ParkingServiceDetails";
import ParkingServiceContracts from "@/components/parking-services/ParkingServiceContracts";
import ParkingServiceServicesOverview from "@/components/parking-services/ParkingServiceServicesOverview";
import ParkingServiceReports from "@/components/parking-services/ParkingServiceReports";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Banknote, Pencil } from "lucide-react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import DetailSkeleton from "@/components/skeletons/DetailSkeleton";
import { formatCurrency } from "@/lib/utils";
import { months } from "@/lib/constants";
import { getReportFileNames } from "@/actions/reports/getReportFileNames";

export const metadata: Metadata = {
  title: "Parking Service Details | Contract Management System",
  description: "View parking service details in the contract management system",
};

export default async function ParkingServiceDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const parkingServiceResult = await getParkingServiceById(id);
  
  if (!parkingServiceResult.success || !parkingServiceResult.data) {
    notFound();
  }
  
  const parkingService = parkingServiceResult.data;
  
  // Fetch all stats in parallel
  const [
    contractsCount,
    servicesCount,
    activeContractsCount,
    totalRevenue,
    avgDailyRevenue,
    serviceStats,
    monthlyRevenueStats
  ] = await Promise.all([
    getContractsCountForParkingService(id),
    getServicesCountForParkingService(id),
    getActiveContractsCount(id),
    getTotalParkingRevenue(id),
    getAvgDailyParkingRevenue(id),
    getParkingServiceStats(id),
    getMonthlyRevenueStats(id)
  ]);

  const formattedParkingServiceName = parkingService.name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

    const monthMap: Record<string, number> = {
    'january': 1, 'february': 2, 'march': 3, 'april': 4,
    'may': 5, 'june': 6, 'july': 7, 'august': 8,
    'september': 9, 'october': 10, 'november': 11, 'december': 12
  };

  const reportFiles = await getReportFileNames(id);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title={parkingService.name}
        description="View parking service details"
        actions={
          <Link href={`/parking-services/${id}/edit`} passHref>
            <Button>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Service
            </Button>
          </Link>
        }
        backLink={{
          href: "/parking-services",
          label: "Back to Services",
        }}
      />
      
      {/* Financial Summary Bar */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="flex flex-col">
          <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
            <Banknote className="w-3 h-3" /> Total Revenue
          </span>
          <span className="font-mono">{formatCurrency(totalRevenue)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
            <Banknote className="w-3 h-3" /> Avg Daily Revenue
          </span>
          <span className="font-mono">{formatCurrency(avgDailyRevenue)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
            <Banknote className="w-3 h-3" /> Transactions
          </span>
          <span className="font-mono">{serviceStats.totalTransactions || 0}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
            <Banknote className="w-3 h-3" /> Active Contracts
          </span>
          <span className="font-mono">{activeContractsCount}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
            <Banknote className="w-3 h-3" /> Total Services
          </span>
          <span className="font-mono">{servicesCount}</span>
        </div>
      </div>
      
      {/* Monthly Revenue Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Monthly Revenue Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {monthlyRevenueStats.length > 0 ? (
                  monthlyRevenueStats.map((stat, index) => {
                    // Extract year and month from "YYYY-MM" format
                    const [year, month] = stat.month_year.split('-');
                    
                    // Remove leading zero from month
                    const monthNum = parseInt(month, 10);
                    
                    // Create base path without filename
                    const basePath = `/parking-service/${formattedParkingServiceName}/report/${year}/${monthNum}/original/`;
                    
                    // Find matching report file
                    const reportFile = reportFiles.find(file => 
                      file.includes(year) && 
                      file.includes(monthNum.toString()) &&
                      file.toLowerCase().includes(formattedParkingServiceName.toLowerCase())
                    );

                    return (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {stat.month_year}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(stat.total_amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {stat.total_quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(stat.average_price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {reportFile ? (
                            <Link 
                              href={`${basePath}${encodeURIComponent(reportFile)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              View Report
                            </Link>
                          ) : (
                            <span className="text-gray-400">Report not found</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      No monthly revenue data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="details">
        <TabsList className="mb-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="services-overview">Services Overview</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details">
          <Card>
            <CardContent className="pt-6">
              <ParkingServiceDetails 
                parkingService={parkingService}
                contractsCount={contractsCount}
                servicesCount={servicesCount}
                activeContractsCount={activeContractsCount}
                totalRevenue={totalRevenue}
                avgDailyRevenue={avgDailyRevenue}
                totalTransactions={serviceStats.totalTransactions}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="contracts">
          <Card>
            <CardContent className="pt-6">
              <Suspense fallback={<DetailSkeleton />}>
                <ParkingServiceContracts parkingServiceId={id} />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="services-overview">
          <Card>
            <CardContent className="pt-6">
              <Suspense fallback={<DetailSkeleton />}>
                <ParkingServiceServicesOverview 
                  parkingServiceId={id}
                  parkingServiceName={parkingService.name}
                />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reports">
          <Card>
            <CardContent className="pt-6">
              <ParkingServiceReports 
                parkingServiceId={id}
                parkingServiceName={parkingService.name}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}