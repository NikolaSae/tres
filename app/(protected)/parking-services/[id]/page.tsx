//app/(protected)/parking-services/[id]/page.tsx

import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getParkingServiceById } from "@/actions/parking-services/getParkingServiceById";
import ParkingServiceDetails from "@/components/parking-services/ParkingServiceDetails";
import ParkingServiceContracts from "@/components/parking-services/ParkingServiceContracts";
import ParkingServiceServicesOverview from "@/components/parking-services/ParkingServiceServicesOverview";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil } from "lucide-react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import DetailSkeleton from "@/components/skeletons/DetailSkeleton";
import { getContractsCountForParkingService } from "@/actions/parking-services/getContractsCount";
import { getServicesCountForParkingService } from "@/actions/parking-services/getServicesCount";
import ParkingServiceReports from "@/components/parking-services/ParkingServiceReports";

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
  
  // Fetch counts for related entities
  const contractsCount = await getContractsCountForParkingService(id);
  const servicesCount = await getServicesCountForParkingService(id);

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
      
      <Tabs defaultValue="details">
        <TabsList className="mb-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="services-overview">Services Overview</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger> {/* nova kartica */}
        </TabsList>
        
        <TabsContent value="details">
          <Card>
            <CardContent className="pt-6">
              <ParkingServiceDetails 
                parkingService={parkingService}
                contractsCount={contractsCount}
                servicesCount={servicesCount}
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
              <ParkingServiceReports parkingServiceId={id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}