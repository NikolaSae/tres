// app/(protected)/parking-services/[id]/edit/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getParkingServiceById } from "@/actions/parking-services/getParkingServiceById";
import ParkingServiceForm from "@/components/parking-services/ParkingServiceForm";
import PageHeader from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";
import type { ParkingServiceFormData } from "@/lib/types/parking-service-types";

export const metadata: Metadata = {
  title: "Edit Parking Service | Contract Management System",
  description: "Edit parking service in the contract management system",
};

export default async function EditParkingServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const parkingServiceResult = await getParkingServiceById(id);
  
  if (!parkingServiceResult.success || !parkingServiceResult.data) {
    notFound();
  }
  
  const parkingService = parkingServiceResult.data;

  const formData: ParkingServiceFormData = {
    id: parkingService.id,
    name: parkingService.name,
    contactName: parkingService.contactName || undefined,
    description: parkingService.description || undefined,
    email: parkingService.email || undefined,
    phone: parkingService.phone || undefined,
    address: parkingService.address || undefined,
    additionalEmails: parkingService.additionalEmails || [],
    isActive: parkingService.isActive,
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <BackButton />
        <PageHeader
          title="Edit Parking Service"
          description={`Edit ${parkingService.name}`}
        />
      </div>
      
      <div className="max-w-2xl">
        <ParkingServiceForm 
          initialData={formData}
          isEditing={true}
        />
      </div>
    </div>
  );
}