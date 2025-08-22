//app/(protected)/parking-services/new/page.tsx

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { z } from "zod";
import { create } from "@/actions/parking-services/create";
import ParkingServiceForm from "@/components/parking-services/ParkingServiceForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Create Parking Service | Contract Management System",
  description: "Create a new parking service in the contract management system",
};

export default function CreateParkingServicePage() {
  // Server action to create a new parking service
  async function createParkingService(formData: FormData) {
    "use server";
    
    const rawData = Object.fromEntries(formData.entries());
    
    // Process boolean fields
    const data = {
      ...rawData,
      isActive: rawData.isActive === "on" || rawData.isActive === "true",
    };
    
    try {
      const result = await create(data);
      
      // Redirect to the new parking service page if successful
      if (result.success) {
        redirect(`/parking-services/${result.data.id}`);
      }
      
      return result;
    } catch (error) {
      console.error("Error creating parking service:", error);
      return {
        success: false,
        error: "Failed to create parking service. Please try again."
      };
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6 top-0">
      <PageHeader
        title="Create Parking Service"
        description="Add a new parking service to the system"
        backLink={{
          href: "/parking-services",
          label: "Back to Services",
        }}
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Parking Service Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ParkingServiceForm 
            action={createParkingService}
            submitLabel="Create Parking Service"
          />
        </CardContent>
      </Card>
    </div>
  );
}