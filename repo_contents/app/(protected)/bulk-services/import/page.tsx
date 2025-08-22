///app/(protected)/bulk-services/import/page.tsx

import { Metadata } from "next";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import ImportForm from "@/components/bulk-services/ImportForm";
import { getAllServices } from "@/actions/services/getAllServices";
import { getAllProviders } from "@/actions/providers/getAllProviders";

export const metadata: Metadata = {
  title: "Import Bulk Services",
  description: "Import bulk services from CSV file",
};

export default async function ImportBulkServicesPage() {
  // Fetch services and providers for mapping during import
  const services = await getAllServices({ type: "BULK" });
  const providers = await getAllProviders({ isActive: true });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <Heading
          title="Import Bulk Services"
          description="Upload a CSV file to import bulk services"
        />
      </div>
      <Separator />
      <ImportForm 
        services={services} 
        providers={providers} 
      />
    </div>
  );
}