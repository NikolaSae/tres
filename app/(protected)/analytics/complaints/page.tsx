// Path: app/(protected)/analytics/complaints/page.tsx

import { auth } from "@/auth";
import { Metadata } from "next";
import { db } from '@/lib/db';
import { Suspense } from "react";

import { DataFilters, DataFilterOptions } from "@/components/analytics/DataFilters";
import ComplaintAnalytics from "@/components/analytics/ComplaintAnalytics";
import { AnomalyDetection } from "@/components/analytics/AnomalyDetection";
import { Card } from "@/components/ui/card";

import { getComplaintStats, ComplaintStatsParams, ComplaintStats } from "@/actions/analytics/get-complaint-stats";

export const dynamic = 'force-dynamic';

// Update types to reflect that searchParams and params are Promises
interface ComplaintAnalyticsPageProps {
    params: Promise<{ [key: string]: string | string[] | undefined }>; // Assuming params is also a Promise based on docs
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const metadata: Metadata = {
  title: "Complaint Analytics",
  description: "Analysis and trends of complaint data",
};

async function fetchProvidersForFilters() {
     try {
         const providers = await db.provider.findMany({
              select: { id: true, name: true },
              orderBy: { name: 'asc' },
         });
         console.log("Successfully fetched providers for Complaints filters:", providers.length, "items");
         return providers;
    } catch (error) {
        console.error("Error fetching providers for Complaints filters:", error);
        return [];
    }
}

async function fetchServiceTypesForFilters() {
     try {
         console.log("Attempting to fetch services with provider links for Complaints filter...");
         const services = await db.service.findMany({
            select: {
                id: true,
                name: true,
                type: true,
                vasServices: { select: { provajderId: true } },
                bulkServices: { select: { providerId: true } },
            },
            orderBy: { name: 'asc' },
         });
         console.log("Successfully fetched services with provider links for Complaints filter:", services.length, "items");
         const servicesWithProviderLinks = services.map(service => {
             const associatedProviderIds = new Set<string>();
             service.vasServices?.forEach(vs => associatedProviderIds.add(vs.provajderId));
             service.bulkServices?.forEach(bs => associatedProviderIds.add(bs.providerId));
             return {
                 id: service.id,
                 name: `${service.name} (${service.type})`,
                 type: service.type,
                 providerIds: Array.from(associatedProviderIds),
             };
         });
         return servicesWithProviderLinks;
     } catch (error) {
        console.error("Error fetching services with provider links for Complaints filter:", error);
        return [];
     }
}

async function fetchProductsForFilters() {
     try {
         const products = await db.product.findMany({
              select: { id: true, name: true },
              orderBy: { name: 'asc' },
         });
         console.log("Successfully fetched products for Complaints filters:", products.length, "items");
         return products;
    } catch (error) {
        console.error("Error fetching products for Complaints filters:", error);
        return [];
    }
}

async function fetchComplaintStatusesForFilters() {
    const statuses = ["NEW", "ASSIGNED", "IN_PROGRESS", "PENDING", "RESOLVED", "CLOSED", "REJECTED"];
    return statuses.map(status => ({
        id: status,
        name: status.replace(/_/g, ' '),
    }));
}

async function fetchComplaintPrioritiesForFilters() {
     const priorities = [1, 2, 3, 4, 5];
     return priorities.map(priority => ({
        id: priority.toString(),
        name: `Priority ${priority}`,
    }));
}


export default async function ComplaintAnalyticsPage(props: ComplaintAnalyticsPageProps) {
  // Await searchParams prop as per Next.js 15.3+ documentation
  const searchParams = await props.searchParams;
  // Also await params if your page component uses dynamic route parameters, although this page doesn't seem to use them
  // const params = await props.params;


  const session = await auth();

  if (!session || !session.user) {
    return <div>Access denied. Please log in to view complaint analytics.</div>;
  }

    // Parse statuses and priorities separately since they're not in DataFilterOptions
    const statuses = typeof searchParams.statuses === 'string' ? searchParams.statuses.split(',') : [];
    const priorities = typeof searchParams.priorities === 'string' ? searchParams.priorities.split(',') : [];

    // Now searchParams is the resolved object, access properties directly
    const filters: DataFilterOptions = {
       dateRange: {
           from: typeof searchParams.dateFrom === 'string' ? new Date(searchParams.dateFrom) : null,
           to: typeof searchParams.dateTo === 'string' ? new Date(searchParams.dateTo) : null,
       },
       providerIds: typeof searchParams.providers === 'string' ? searchParams.providers.split(',') : [],
       serviceTypes: typeof searchParams.serviceTypes === 'string' ? searchParams.serviceTypes.split(',') : [],
       productIds: typeof searchParams.products === 'string' ? searchParams.products.split(',') : [],
       searchQuery: typeof searchParams.q === 'string' ? searchParams.q : '',
       sortBy: typeof searchParams.sort === 'string' ? searchParams.sort : 'date',
       sortOrder: typeof searchParams.order === 'string' ? (searchParams.order as 'asc' | 'desc') : 'desc',
     };

    // Map filters object to ComplaintStatsParams format
    const complaintStatsParams: ComplaintStatsParams = {
         startDate: filters.dateRange?.from || undefined,
         endDate: filters.dateRange?.to || undefined,
         providerIds: filters.providerIds && filters.providerIds.length > 0 ? filters.providerIds : undefined,
         serviceIds: filters.serviceTypes && filters.serviceTypes.length > 0 ? filters.serviceTypes : undefined,
         productIds: filters.productIds && filters.productIds.length > 0 ? filters.productIds : undefined,
         statuses: statuses.length > 0 ? (statuses as any) : undefined,
         priorities: priorities.length > 0 ? priorities.map(p => parseInt(p, 10)) : undefined,
         searchQuery: filters.searchQuery || undefined,
         sortBy: filters.sortBy || undefined,
         sortOrder: filters.sortOrder || undefined,
    };


   // Dohvatanje podataka za filtere (oni se ne menjaju na osnovu searchParams)
   const providersData = await fetchProvidersForFilters();
   const serviceTypesData = await fetchServiceTypesForFilters();
   const productsData = await fetchProductsForFilters();
   const statusesData = await fetchComplaintStatusesForFilters();
   const prioritiesData = await fetchComplaintPrioritiesForFilters();

   // Dohvatanje podataka za analitiku na osnovu primenjenih filtera
   let complaintStats: ComplaintStats | null = null;
   let fetchError: any = null;
   try {
        console.log("Parameters passed to getComplaintStats:", complaintStatsParams);
        complaintStats = await getComplaintStats(complaintStatsParams);
   } catch (error: any) {
        console.error("Error fetching complaint stats:", error);
        fetchError = error;
   }


return (
    <div className="container mx-auto py-8 space-y-8 top-0">
      <div>
        <h1 className="text-3xl font-bold">Complaint Analytics</h1>
        <p className="text-muted-foreground">
          Monitor complaint trends, resolution rates, and performance metrics
        </p>
      </div>
      <div>
        <Suspense fallback={<div>Loading filters...</div>}>
          <DataFilters
            initialFilters={filters}
            showDateRange={true}
            showProviders={true}
            showServiceTypes={true}
            showProducts={true}
            showSearch={true}
            showSort={true}
            providersData={providersData}
            serviceTypesData={serviceTypesData}
            productsData={productsData}
            statusesData={statusesData}
            prioritiesData={prioritiesData}
          />
        </Suspense>
      </div>

      <div className="grid gap-6">
        <Suspense fallback={<div>Loading Complaint Analytics...</div>}>
          <ComplaintAnalytics
            data={complaintStats}
            isLoading={false}
            error={fetchError}
          />
        </Suspense>
        <Card className="p-4">
          <h2 className="text-xl font-semibold mb-4">Complaint Anomalies</h2>
          <AnomalyDetection
            dataType="complaints"
            description="Unusual patterns in complaint submissions or resolution times"
            filters={filters}
          />
        </Card>
      </div>
    </div>
  );
}