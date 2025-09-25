// Path: /app/(protected)/contracts/page.tsx
import { Metadata } from "next";
import Link from "next/link";
import { ContractsSection } from "@/components/contracts/ContractsSection";
import { Button } from "@/components/ui/button";
import { PlusCircle, FileSpreadsheet, Clock } from "lucide-react";
import { db } from "@/lib/db";
import { Contract as ContractType, ContractStatus, ContractType as PrismaContractType } from "@prisma/client";

export const metadata: Metadata = {
  title: "Contracts Management | Management Dashboard",
  description: "View and manage all contracts with advanced filtering and search capabilities.",
};

// Funkcija za dobijanje ugovora iz baze
async function getContracts(searchParams: {
  page?: string;
  limit?: string;
  search?: string;
  status?: string;
  type?: string;
  partner?: string;
}): Promise<{
  contracts: ContractType[]; // Koristiti ContractType za jasnoću
  totalCount: number;
  totalPages: number;
  currentPage: number;
  useServerPagination: boolean;
}> {
  try {
    // Parse page and limit regardless of server filters
    const page = parseInt(searchParams.page || '1');
    const limit = parseInt(searchParams.limit || '25');

    // Check if there are any server-side filters (excluding page and limit for this check)
    const hasServerFilters = Boolean(
      searchParams.search?.trim() ||
      (searchParams.status && Object.values(ContractStatus).includes(searchParams.status as ContractStatus)) ||
      (searchParams.type && Object.values(ContractType).includes(searchParams.type as ContractType)) ||
      searchParams.partner
    );

    const where: any = {};
    const conditions = [];

    // Search filter
    if (searchParams.search && searchParams.search.trim()) {
      conditions.push({
        OR: [
          { name: { contains: searchParams.search.trim(), mode: 'insensitive' as const } },
          { contractNumber: { contains: searchParams.search.trim(), mode: 'insensitive' as const } },
          { description: { contains: searchParams.search.trim(), mode: 'insensitive' as const } },
          { provider: { name: { contains: searchParams.search.trim(), mode: 'insensitive' as const } } },
          { humanitarianOrg: { name: { contains: searchParams.search.trim(), mode: 'insensitive' as const } } },
          { parkingService: { name: { contains: searchParams.search.trim(), mode: 'insensitive' as const } } },
        ]
      });
    }

    // Status filter
    if (searchParams.status && Object.values(ContractStatus).includes(searchParams.status as ContractStatus)) {
      conditions.push({ status: searchParams.status });
    }

    // Type filter
    if (searchParams.type && Object.values(ContractType).includes(searchParams.type as ContractType)) {
      conditions.push({ type: searchParams.type });
    }

    // Partner filter
    if (searchParams.partner) {
      conditions.push({
        OR: [
          { providerId: searchParams.partner },
          { humanitarianOrgId: searchParams.partner },
          { parkingServiceId: searchParams.partner }
        ]
      });
    }

    // Apply conditions if any exist
    if (conditions.length > 0) {
      where.AND = conditions;
    }

    if (hasServerFilters) {
      // SERVER-SIDE PAGINATION: Apply pagination when there are server filters
      const skip = (page - 1) * limit;

      const [contracts, totalCount] = await Promise.all([
        db.contract.findMany({
          where,
          include: {
            provider: { select: { id: true, name: true } },
            humanitarianOrg: { select: { id: true, name: true } },
            parkingService: { select: { id: true, name: true } },
            services: true,
            _count: {
              select: {
                services: true,
                attachments: true,
                reminders: true
              }
            }
          },
          orderBy: { updatedAt: 'desc' },
          skip,
          take: limit,
        }),
        db.contract.count({ where })
      ]);
      
      const totalPages = Math.ceil(totalCount / limit);

      return {
        contracts,
        totalCount,
        totalPages,
        currentPage: page, // Use the parsed page for server-side
        useServerPagination: true
      };
    } else {
      // CLIENT-SIDE PAGINATION: Load ALL contracts when no server filters
      // Still respect the 'where' clause here in case client-side filters were cleared, but a search term persisted or similar
      const contracts = await db.contract.findMany({
        where, // Apply conditions if they exist
        include: {
          provider: { select: { id: true, name: true } },
          humanitarianOrg: { select: { id: true, name: true } },
          parkingService: { select: { id: true, name: true } },
          services: true,
          _count: {
            select: {
              services: true,
              attachments: true,
              reminders: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        // NO skip/take - load ALL contracts to be filtered/paginated client-side
      });

      return {
        contracts,
        totalCount: contracts.length,
        totalPages: Math.ceil(contracts.length / limit), // Use parsed limit for client-side totalPages
        currentPage: page, // IMPORTANT: Use the parsed page from searchParams for initial client-side page
        useServerPagination: false
      };
    }
  } catch (error) {
    console.error('Error fetching contracts:', error);
    return {
      contracts: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: parseInt(searchParams.page || '1'), // Return parsed page even on error
      useServerPagination: false
    };
  }
}

async function getServerTime() {
  return new Date().toISOString();
}

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined }; // searchParams are not a Promise in Next.js 13+ App Router
}

export const dynamic = 'auto'; // Keep as 'auto'

async function getSafeParams(searchParams: { [key: string]: string | string[] | undefined }) { // Updated type
  return {
    page: typeof searchParams.page === 'string' ? searchParams.page : undefined,
    limit: typeof searchParams.limit === 'string' ? searchParams.limit : undefined,
    search: typeof searchParams.search === 'string' ? searchParams.search : undefined,
    status: typeof searchParams.status === 'string' ? searchParams.status : undefined,
    type: typeof searchParams.type === 'string' ? searchParams.type : undefined,
    partner: typeof searchParams.partner === 'string' ? searchParams.partner : undefined,
  };
}

export default async function ContractsPage({ searchParams }: PageProps) {
  const safeParams = await getSafeParams(searchParams);

  // Fetch data with clean params
  const { contracts, totalCount, totalPages, currentPage, useServerPagination } = await getContracts(safeParams);
  const serverTime = await getServerTime();

  // Create stable key for ContractsSection to prevent unnecessary re-mounts
  // The key changes when searchParams change, causing ContractsSection to remount
  const sectionKey = JSON.stringify(safeParams);

  return (
    <div className="bg-card min-h-screen">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header sekcija */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6 rounded-lg shadow-sm border">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">
              Contracts Management
            </h1>
            <p className="max-w-2xl">
              Manage all contracts in the system. Use filters to quickly find specific contracts by type, status, partner, or search terms.
            </p>
            <div className="flex items-center gap-4 text-sm mt-2">
              <span className="flex items-center gap-1 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Active
              </span>
              <span className="flex items-center gap-1 text-gray-600">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                Draft
              </span>
              <span className="flex items-center gap-1 text-yellow-600">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                Pending
              </span>
              <span className="flex items-center gap-1 text-red-600">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                Expired
              </span>
            </div>
            
            {/* Debug info - ukloni posle testiranja */}
            <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded">
              Debug: Total contracts loaded: {contracts.length} | 
              Server pagination: {useServerPagination ? 'Yes' : 'No'} |
              Has filters: {Object.values(safeParams).some(v => v) ? 'Yes' : 'No'}
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Button variant="outline" asChild className="order-3 sm:order-1">
              <Link href="/contracts/import" className="flex items-center justify-center">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Import Contracts
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="order-2 sm:order-2">
              <Link href="/contracts/expiring" className="flex items-center justify-center">
                <Clock className="mr-2 h-4 w-4" />
                Expiring Contracts
              </Link>
            </Button>
            
            <Button asChild className="order-1 sm:order-3">
              <Link href="/contracts/new" className="flex items-center justify-center">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Contract
              </Link>
            </Button>
          </div>
        </div>

        {/* ContractsSection komponenta */}
        <ContractsSection 
          key={sectionKey}
          initialContracts={contracts}
          serverTime={serverTime}
          initialTotalCount={totalCount}
          initialTotalPages={totalPages}
          initialCurrentPage={currentPage}
          useServerPagination={useServerPagination}
        />

        {/* Footer info */}
        <div className="p-4 rounded-lg border text-center">
          <p className="text-sm">
            Need help managing contracts? Check out our{" "}
            <Link href="/help/contracts" className="text-blue-600 hover:text-blue-800 underline">
              documentation
            </Link>{" "}
            or{" "}
            <Link href="/support" className="text-blue-600 hover:text-blue-800 underline">
              contact support
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}