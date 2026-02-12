//app/(protected)/parking-services/new/page.tsx

import { Metadata } from "next";
import ParkingServiceForm from "@/components/parking-services/ParkingServiceForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";

export const metadata: Metadata = {
  title: "Create Parking Service | Contract Management System",
  description: "Create a new parking service in the contract management system",
};

export default function CreateParkingServicePage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <BackButton />
        <PageHeader
          title="Create Parking Service"
          description="Add a new parking service to the system"
        />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Parking Service Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ParkingServiceForm />
        </CardContent>
      </Card>
    </div>
  );
}