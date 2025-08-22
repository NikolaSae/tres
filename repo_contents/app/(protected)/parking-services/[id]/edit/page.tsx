//app/(protected)/parking-services/[id]/edit/page.tsx

import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getParkingServiceById } from "@/actions/parking-services/getParkingServiceById";
import ParkingServiceForm from "@/components/parking-services/ParkingServiceForm";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Edit Parking Service | Contract Management System",
  description: "Edit parking service in the contract management system",
};

export default async function EditParkingServicePage({
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="Edit Parking Service"
        description={`Edit ${parkingService.name}`}
        backLink={{
          href: `/parking-services/${id}`,
          label: "Back to Service Details",
        }}
      />
      
      <div className="max-w-2xl">
        <ParkingServiceForm 
          initialData={parkingService}
          isEditing={true}
        />
      </div>
    </div>
  );
}