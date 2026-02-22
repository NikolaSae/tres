// app/(protected)/analytics/financials/page.tsx

import { Suspense } from "react";
import { DataFilters, DataFilterOptions } from "@/components/analytics/DataFilters";
import CombinedFinancialView from "@/components/analytics/CombinedFinancialView";
import { auth } from "@/auth";
import { getVasFinancialData, getParkingFinancialData, getHumanitarianFinancialData } from "./actions";
import { db } from '@/lib/db';

interface FinancialAnalyticsPageProps {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
}

async function fetchProvidersForFilters() {
  try {
    console.log("Attempting to fetch providers for filters...");
    const providers = await db.provider.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    console.log("Successfully fetched providers:", providers.length, "items");
    return providers;
  } catch (error) {
    console.error("Error fetching providers for filters (Financial):", error);
    return [];
  }
}

async function fetchParkingServicesForFilters() {
  try {
    console.log("Attempting to fetch parking services for filters...");
    const parkingServices = await db.parkingService.findMany({
      select: { id: true, name: true },
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    console.log("Successfully fetched parking services:", parkingServices.length, "items");
    return parkingServices;
  } catch (error) {
    console.error("Error fetching parking services for filters:", error);
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
    return serviceTypes.map(service => ({
      id: service.id,
      name: `${service.name} (${service.type})`,
    }));
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
    return products;
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

  // Await searchParams in Next.js 15+
  const params = await searchParams;

  const filters: DataFilterOptions = {
    dateRange: { from: null, to: null },
    sortBy: 'date',
    sortOrder: 'desc',
    providerIds: [],
    parkingServiceIds: [],
    serviceTypes: [],
    productIds: [],
    searchQuery: '',
  };

  // Get search params safely
  const dateFrom = params?.dateFrom;
  const dateTo = params?.dateTo;
  const providers = params?.providers;
  const parkingServices = params?.parkingServices;
  const serviceTypes = params?.serviceTypes;
  const products = params?.products;
  const q = params?.q;
  const sort = params?.sort;
  const order = params?.order;

  // Apply date range filter
  if (typeof dateFrom === 'string') {
    try {
      filters.dateRange = {
        from: new Date(dateFrom),
        to: filters.dateRange?.to ?? null
      };
    } catch (e) {
      console.error("Invalid dateFrom parameter:", e);
    }
  }

  if (typeof dateTo === 'string') {
    try {
      filters.dateRange = {
        from: filters.dateRange?.from ?? null,
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

  // Apply parking service filter
  if (typeof parkingServices === 'string') {
    filters.parkingServiceIds = parkingServices.split(',');
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
  const vasDataParams = {
    startDate: filters.dateRange?.from || undefined,
    endDate: filters.dateRange?.to || undefined,
    serviceType: filters.serviceTypes?.length ? filters.serviceTypes[0] : undefined,
    providerId: filters.providerIds?.length ? filters.providerIds[0] : undefined,
    searchQuery: filters.searchQuery || undefined,
  };

  const parkingDataParams = {
    startDate: filters.dateRange?.from || undefined,
    endDate: filters.dateRange?.to || undefined,
    parkingServiceId: filters.parkingServiceIds?.length ? filters.parkingServiceIds[0] : undefined,
  };

  // Get financial data for both VAS and Parking
const [vasFinancialData, parkingFinancialData, humanitarianFinancialData] = await Promise.all([
  getVasFinancialData(vasDataParams),
  getParkingFinancialData(parkingDataParams),
  getHumanitarianFinancialData({ startDate: filters.dateRange?.from || undefined, endDate: filters.dateRange?.to || undefined }),
]);

  // Fetch filter data
  const [providersData, parkingServicesData, serviceTypesData, productsData] = await Promise.all([
    fetchProvidersForFilters(),
    fetchParkingServicesForFilters(),
    fetchServiceTypesForFilters(),
    fetchProductsForFilters(),
  ]);

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Title section */}
      <div>
        <h1 className="text-3xl font-bold">Financial Analytics</h1>
        <p className="text-muted-foreground">
          Comprehensive financial performance metrics and analysis
        </p>
      </div>

      {/* Filters section */}
      <div>
        <Suspense fallback={<div>Loading filters...</div>}>
          <DataFilters
            initialFilters={filters}
            className="mb-6"
            providersData={providersData}
            parkingServicesData={parkingServicesData}
            serviceTypesData={serviceTypesData}
            productsData={productsData}
            showDateRange={true}
            showProviders={true}
            showParkingServices={true}
            showServiceTypes={true}
            showProducts={false}
            showSearch={false}
            showSort={false}
          />
        </Suspense>
      </div>

      {/* Financial data section with tabs */}
      <div className="grid gap-6">
        <Suspense fallback={<div>Loading financial data...</div>}>
          <CombinedFinancialView 
            vasData={vasFinancialData} 
            parkingData={parkingFinancialData}
            humanitarianData={humanitarianFinancialData}
          />
        </Suspense>
      </div>
    </div>
  );
}