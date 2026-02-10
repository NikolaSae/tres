///app/(protected)/bulk-services/import/page.tsx

import { Metadata } from "next";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import ImportForm from "@/components/bulk-services/ImportForm";

export const metadata: Metadata = {
  title: "Import Bulk Services",
  description: "Import bulk services from CSV file",
};

export default async function ImportBulkServicesPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <Heading
          title="Import Bulk Services"
          description="Upload a CSV file to import bulk services"
        />
      </div>
      <Separator />
      <ImportForm />
    </div>
  );
}