//app/(protected)/bulk-services/new/page.tsx

import { Metadata } from "next";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { BulkServiceForm } from "@/components/bulk-services/BulkServiceForm";
import { getAllServices } from "@/actions/services/getAllServices";
import { getAllProviders } from "@/actions/providers/getAllProviders";

export const metadata: Metadata = {
  title: "Create Bulk Service",
  description: "Add a new bulk service to the system",
};

export default async function NewBulkServicePage() {
  // Fetch services and providers for the form
  const services = await getAllServices({ type: "BULK" });
  const providers = await getAllProviders({ isActive: true });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <Heading
          title="Create New Bulk Service"
          description="Add a new bulk service to the system"
        />
      </div>
      <Separator />
      <BulkServiceForm 
        services={services} 
        providers={providers} 
        initialData={null} 
      />
    </div>
  );
}