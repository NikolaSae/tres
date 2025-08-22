///app/(protected)/analytics/sales/page.tsx

import { auth } from "@/auth";
import { SalesChart } from "@/components/analytics/SalesChart";
import { DataFilters } from "@/components/analytics/DataFilters";
import { Metadata } from "next";
import { db } from '@/lib/db';

export const metadata = {
  title: "Sales Analytics",
  description: "Sales performance metrics and trend analysis",
};

interface SalesAnalyticsPageProps {
    searchParams: { [key: string]: string | string[] | undefined };
}

async function fetchProvidersForFilters() {
     try {
         console.log("Attempting to fetch providers for filters...");
          const providers = await db.provider.findMany({
              select: { id: true, name: true },
              orderBy: { name: 'asc' },
          });
          console.log("Successfully fetched providers:", providers.length, "items");
          console.log("Provider data sample:", providers.slice(0, 5));
          return providers;
         console.warn("Placeholder fetchProvidersForFilters used in Sales Analytics.");
         return [];
    } catch (error) {
        console.error("Error fetching providers for filters (Sales):", error);
        return [];
    }
}

async function fetchServiceTypesForFilters() {
     try {
         console.log("Attempting to fetch services for service types filter...");
          const serviceTypes = await db.service.findMany({
            select: { id: true, name: true, type: true },
            orderBy: { name: 'asc' },
          });
          console.log("Successfully fetched services:", serviceTypes.length, "items");
          console.log("Service data sample:", serviceTypes.slice(0, 5));
          return serviceTypes.map(service => ({
              id: service.id,
              name: `${service.name} (${service.type})`,
          }));
         console.warn("Placeholder fetchServiceTypesForFilters used in Sales Analytics.");
         return [];
    } catch (error) {
        console.error("Error fetching service types for filters (Sales):", error);
        return [];
    }
}

async function fetchProductsForFilters() {
     try {
         console.log("Attempting to fetch products for filters...");
          const products = await db.product.findMany({
              select: { id: true, name: true },
              orderBy: { name: 'asc' },
          });
          console.log("Successfully fetched products:", products.length, "items");
          console.log("Product data sample:", products.slice(0, 5));
          return products;
         console.warn("Placeholder fetchProductsForFilters used in Sales Analytics.");
         return [];
    } catch (error) {
        console.error("Error fetching products for filters (Sales):", error);
        return [];
    }
}


export default async function SalesAnalyticsPage({ searchParams }: SalesAnalyticsPageProps) {
  const session = await auth();

  if (!session || !session.user) {
    return <div>Access denied. Please log in to view sales analytics.</div>;
  }

  const filters = {
       startDate: typeof searchParams.dateFrom === 'string' ? new Date(searchParams.dateFrom) : undefined,
       endDate: typeof searchParams.dateTo === 'string' ? new Date(searchParams.dateTo) : undefined,
       serviceType: typeof searchParams.serviceTypes === 'string' ? searchParams.serviceTypes.split(',')[0] : undefined,
       providerId: typeof searchParams.providers === 'string' ? searchParams.providers.split(',')[0] : undefined,
       period: typeof searchParams.period === 'string' ? searchParams.period : 'monthly',
  };

   const providersData = await fetchProvidersForFilters();
   const serviceTypesData = await fetchServiceTypesForFilters();
   const productsData = await fetchProductsForFilters();


return (
  <div className="container mx-auto py-8 space-y-8 top-0">
    {/* Title section */}
    <div>
      <h1 className="text-3xl font-bold">Sales Analytics</h1>
      <p className="text-muted-foreground">
        Detailed sales performance metrics and trend analysis
      </p>
    </div>

    {/* Filters below title */}
    <div>
      <DataFilters
        showDateRange={true}
        showProviders={true}
        showServiceTypes={true}
        showProducts={false}
        showSearch={true}
        showSort={true}
        providersData={providersData}
        serviceTypesData={serviceTypesData}
        productsData={productsData}
      />
    </div>

    <div className="grid gap-6">
      <SalesChart filters={filters} />
    </div>
  </div>
);
}