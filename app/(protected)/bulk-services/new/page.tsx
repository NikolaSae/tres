// app/(protected)/bulk-services/new/page.tsx

import { Metadata } from "next";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { BulkServiceForm } from "@/components/bulk-services/BulkServiceForm";
import { getAllServices } from "@/actions/services/getAllServices";
import { getAllProviders } from "@/actions/providers/getAllProviders";
import { unstable_cache } from 'next/cache';

export const metadata: Metadata = {
  title: "Create Bulk Service",
  description: "Add a new bulk service to the system",
};

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Cache helper functions
const getCachedServices = unstable_cache(
  async () => getAllServices({ type: "BULK" }),
  ['bulk-services-list'],
  {
    revalidate: 300, // 5 minutes
    tags: ['services', 'bulk-services']
  }
);

const getCachedProviders = unstable_cache(
  async () => getAllProviders({ isActive: true }),
  ['active-providers-list'],
  {
    revalidate: 300, // 5 minutes
    tags: ['providers']
  }
);

export default async function NewBulkServicePage() {
  // Use parallel fetching with cached data
  const [services, providers] = await Promise.all([
    getCachedServices(),
    getCachedProviders(),
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