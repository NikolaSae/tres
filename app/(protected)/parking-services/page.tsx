//app/(protected)/parking-services/page.tsx
import { Suspense } from "react";
import { Metadata } from "next";
import { getParkingServices } from "@/actions/parking-services/getParkingServices";
import ParkingServiceList from "@/components/parking-services/ParkingServiceList";
import ParkingServiceFilters from "@/components/parking-services/ParkingServiceFilters";
import ParkingReportSender from "@/components/parking-services/ParkingReportSender";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import ListSkeleton from "@/components/skeletons/ListSkeleton";

export const metadata: Metadata = {
  title: "Parking Services | Contract Management System",
  description: "Manage parking services in the contract management system",
};

interface ParkingServiceFilters {
  searchTerm?: string;
  isActive?: boolean | undefined;
  serviceNumber?: string;
  hasContracts?: boolean | undefined;
  page: number;
  pageSize: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

async function ParkingServiceListFetcher({ filters }: { filters: ParkingServiceFilters }) {
  const result = await getParkingServices(filters);

  if (!result.success || !result.data) {
    console.error("Failed to fetch parking services:", result.error);
    return <div>Greška pri učitavanju parking servisa: {result.error || "Nepoznata greška"}</div>;
  }

  const { parkingServices, totalCount, page, pageSize, totalPages } = result.data;

  return (
    <ParkingServiceList 
      parkingServices={parkingServices}
      totalCount={totalCount}
      currentPage={page}
      pageSize={pageSize}
      totalPages={totalPages}
    />
  );
}

export default async function ParkingServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const awaitedSearchParams = await searchParams;

  const filters: ParkingServiceFilters = {
    searchTerm: awaitedSearchParams.searchTerm as string | undefined,
    isActive: awaitedSearchParams.isActive === "true" ? true : awaitedSearchParams.isActive === "false" ? false : undefined,
    page: awaitedSearchParams.page ? parseInt(awaitedSearchParams.page as string) : 1,
    pageSize: awaitedSearchParams.pageSize ? parseInt(awaitedSearchParams.pageSize as string) : 10,
    sortBy: awaitedSearchParams.sortBy as string | undefined,
    sortDirection: awaitedSearchParams.sortDirection as "asc" | "desc" | undefined,
  };

  // Fetch all active parking services for report sender
  const allServicesResult = await getParkingServices({
    isActive: true,
    page: 1,
    pageSize: 1000 // Get all active services
  });

  const allActiveServices = allServicesResult.success && allServicesResult.data 
    ? allServicesResult.data.parkingServices 
    : [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Parking Services</h1>
          <p className="text-muted-foreground">
            Upravljajte parking servisima i šaljite izveštaje
          </p>
        </div>
        <Link href="/parking-services/new" passHref>
          <button
            className="
              relative overflow-hidden
              inline-flex items-center justify-center
              px-6 py-3 rounded-xl
              text-white font-semibold text-sm
              bg-gradient-to-r from-blue-900 via-blue-800 to-blue-600
              shadow-lg shadow-blue-600/30
              hover:shadow-xl hover:shadow-blue-600/40
              hover:-translate-y-1
              active:translate-y-0
              transition-all duration-300 ease-in-out
              before:absolute before:inset-0
              before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent
              before:translate-x-[-200%]
              hover:before:translate-x-[200%]
              before:transition-transform before:duration-700
            "
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Dodaj novi servis
          </button>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="services" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="services">Parking Servisi</TabsTrigger>
          <TabsTrigger value="reports">Slanje Izveštaja</TabsTrigger>
        </TabsList>

        {/* Services List Tab */}
        <TabsContent value="services" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Parking servisi</CardTitle>
            </CardHeader>
            <CardContent>
              <ParkingServiceFilters initialFilters={filters} />

              <Suspense fallback={<ListSkeleton count={filters.pageSize} />}>
                <ParkingServiceListFetcher filters={filters} />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Slanje Izveštaja</CardTitle>
            </CardHeader>
            <CardContent>
              <ParkingReportSender parkingServices={allActiveServices} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}