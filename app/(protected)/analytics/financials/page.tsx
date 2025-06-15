// app/(protected)/analytics/financials/page.tsx
import { Suspense } from "react";
import { DataFilters, DataFilterOptions } from "@/components/analytics/DataFilters";
import FinancialOverview from "@/components/analytics/FinancialOverview";
import { auth } from "@/auth";
import { getFinancialData } from "./actions";
import { db } from '@/lib/db';

interface FinancialAnalyticsPageProps {
  searchParams: {
    [key: string]: string | string[] | undefined;
  };
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
         console.warn("Placeholder fetchProvidersForFilters used in Financial Analytics.");
         return [];
    } catch (error) {
        console.error("Error fetching providers for filters (Financial):", error);
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
         console.warn("Placeholder fetchServiceTypesForFilters used in Financial Analytics.");
         return [];
    } catch (error) {
        console.error("Error fetching service types for filters (Financial):", error);
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
         console.warn("Placeholder fetchProductsForFilters used in Financial Analytics.");
         return [];
    } catch (error) {
        console.error("Error fetching products for filters (Financial):", error);
        return [];
    }
}

export const metadata = {
  title: "Financial Analytics",
  description: "Financial performance metrics and analysis",
};


export default async function FinancialAnalyticsPage({
  searchParams,
}: FinancialAnalyticsPageProps) {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const filters: DataFilterOptions = {
    dateRange: { from: null, to: null },
    sortBy: 'date',
    sortOrder: 'desc',
    providerIds: [],
    serviceTypes: [],
    productIds: [],
    searchQuery: '',
  };

  // Get search params safely
  const dateFrom = searchParams?.dateFrom;
  const dateTo = searchParams?.dateTo;
  const providers = searchParams?.providers;
  const serviceTypes = searchParams?.serviceTypes;
  const products = searchParams?.products;
  const q = searchParams?.q;
  const sort = searchParams?.sort;
  const order = searchParams?.order;

  // Apply date range filter
  if (typeof dateFrom === 'string') {
    try {
      filters.dateRange = {
        ...filters.dateRange,
        from: new Date(dateFrom)
      };
    } catch (e) {
      console.error("Invalid dateFrom parameter:", e);
    }
  }

  if (typeof dateTo === 'string') {
    try {
      filters.dateRange = {
        ...filters.dateRange,
        to: new Date(dateTo)
      };
    } catch (e) {
      console.error("Invalid dateTo parameter:", e);
    }
  }

  // Apply provider filter
  if (typeof providers === 'string') {
    filters.providerIds = providers.split(',');
  }

  // Apply service type filter
  if (typeof serviceTypes === 'string') {
    filters.serviceTypes = serviceTypes.split(',');
  }

  // Apply product filter
  if (typeof products === 'string') {
    filters.productIds = products.split(',');
  }

  // Apply search query filter
  if (typeof q === 'string' && q.trim() !== '') {
    filters.searchQuery = q.trim();
  }

  // Handle sort parameters
  if (typeof sort === 'string') {
    filters.sortBy = sort;
  }

  if (typeof order === 'string' && (order === 'asc' || order === 'desc')) {
    filters.sortOrder = order;
  }

  // Map UI filters to financial data params
  const financialDataParams = {
    startDate: filters.dateRange?.from || undefined,
    endDate: filters.dateRange?.to || undefined,
    serviceType: filters.serviceTypes?.length ? filters.serviceTypes[0] : undefined,
    providerId: filters.providerIds?.length ? filters.providerIds[0] : undefined,
    searchQuery: filters.searchQuery || undefined,
  };

  // Get financial data
  const financialData = await getFinancialData(financialDataParams);

  // Fetch real provider, service type, and product data for filters
   const providersData = await fetchProvidersForFilters();
   const serviceTypesData = await fetchServiceTypesForFilters();
   const productsData = await fetchProductsForFilters();


return (
    <div className="container mx-auto py-8 space-y-8 top-0">
      {/* Title section - now separated from filters */}
      <div>
        <h1 className="text-3xl font-bold">Financial Analytics</h1>
        <p className="text-muted-foreground">
          Comprehensive financial performance metrics and analysis
        </p>
      </div>

      {/* Filters section - moved below title */}
      <div>
        <Suspense fallback={<div>Loading filters...</div>}>
          <DataFilters
            initialFilters={filters}
            className="mb-6"
            providersData={providersData}
            serviceTypesData={serviceTypesData}
            productsData={productsData}
            showDateRange={true}
            showProviders={true}
            showServiceTypes={true}
            showProducts={true}
            showSearch={true}
            showSort={true}
          />
        </Suspense>
      </div>

      {/* Financial data section */}
      <div className="grid gap-6">
        <Suspense fallback={<div>Loading financial data...</div>}>
          <FinancialOverview data={financialData} />
        </Suspense>
      </div>
    </div>
  );
}