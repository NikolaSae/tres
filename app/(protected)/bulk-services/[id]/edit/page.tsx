// app/(protected)/bulk-services/[id]/edit/page.tsx

import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { BulkServiceForm } from "@/components/bulk-services/BulkServiceForm";
import { getBulkServiceById } from "@/actions/bulk-services/getBulkServiceById";
import { getAllServices } from "@/actions/services/getAllServices";
import { getAllProviders } from "@/actions/providers/getAllProviders";
import { unstable_cache } from 'next/cache';

export const metadata: Metadata = {
  title: "Edit Bulk Service",
  description: "Modify bulk service details",
};


// Cache helper functions
const getCachedServices = unstable_cache(
  async () => getAllServices({ type: "BULK" }),
  ['bulk-services-list'],
  {
    revalidate: 300,
    tags: ['services', 'bulk-services']
  }
);

const getCachedProviders = unstable_cache(
  async () => getAllProviders({ isActive: true }),
  ['active-providers-list'],
  {
    revalidate: 300,
    tags: ['providers']
  }
);

export default async function EditBulkServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch bulk service without cache (it's being edited)
  // Fetch reference data with cache
  const [bulkService, services, providers] = await Promise.all([
    getBulkServiceById(id),
    getCachedServices(),
    getCachedProviders(),
  ]);

  if (!bulkService) {
    notFound();
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/bulk-services/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Heading
            title="Edit Bulk Service"
            description={`Update details for ${bulkService.agreement_name}`}
          />
        </div>
      </div>
      <Separator />
      <BulkServiceForm 
        services={services} 
        providers={providers} 
        initialData={bulkService}
        isEditing={true}
      />
    </div>
  );
}