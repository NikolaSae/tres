//app/(protected)/parking-services/page.tsx
import { Suspense } from "react";
import { Metadata } from "next";
import { getParkingServices } from "@/actions/parking-services/getParkingServices";
import ParkingServiceList from "@/components/parking-services/ParkingServiceList";
import ParkingServiceFilters from "@/components/parking-services/ParkingServiceFilters";
import ParkingReportSender from "@/components/parking-services/ParkingReportSender";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import ListSkeleton from "@/components/skeletons/ListSkeleton";

export const metadata: Metadata = {
  title: "Parking Services | Contract Management System",
  description: "Manage parking services in the contract management system",
};

interface ParkingServiceFilters {
  searchTerm?: string;
  isActive?: boolean | undefined;
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
  searchParams: { [key: string]: string | string[] | undefined };
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
    <div className="container mx-auto py-6 space-y-6 top-0">
      {/* Header */}
      <div className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold">Parking Services</h1>
          <p className="text-muted-foreground">
            Upravljajte parking servisima za potrebe upravljanja ugovorima
          </p>
        </div>
        <Link href="/parking-services/new" passHref>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Dodaj novi servis
          </Button>
        </Link>
      </div>

      {/* Report Sender Section */}
      <ParkingReportSender parkingServices={allActiveServices} />

      {/* Services List */}
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
    </div>
  );
}