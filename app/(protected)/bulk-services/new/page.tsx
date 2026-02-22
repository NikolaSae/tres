// app/(protected)/bulk-services/new/page.tsx
import { connection } from 'next/server';
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
  await connection();

  const [services, providers] = await Promise.all([
    getAllServices({ type: "BULK" }),
    getAllProviders({ isActive: true }),
  ]);

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