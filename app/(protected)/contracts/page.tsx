// Path: /app/(protected)/contracts/page.tsx
import { Metadata } from "next";
import Link from "next/link";
import { ContractsSection } from "@/components/contracts/ContractsSection";
import { Button } from "@/components/ui/button";
import { PlusCircle, FileSpreadsheet, Clock } from "lucide-react";
import { db } from "@/lib/db";
import { Contract } from "@/lib/types/contract-types";
import { ContractStatus, ContractType } from "@prisma/client";

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
  contracts: Contract[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}> {
  try {
    const page = parseInt(searchParams.page || '1');
    const limit = parseInt(searchParams.limit || '25');
    const skip = (page - 1) * limit;

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

    // ALWAYS apply pagination
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
      currentPage: page
    };
  } catch (error) {
    console.error('Error fetching contracts:', error);
    return {
      contracts: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: 1
    };
  }
}

async function getServerTime() {
  return new Date().toISOString();
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Remove force-dynamic to prevent unnecessary re-execution
export const dynamic = 'auto';

async function getSafeParams(searchParams: Promise<{ [key: string]: string | string[] | undefined }>) {
  const params = await searchParams;
  return {
    page: typeof params.page === 'string' ? params.page : undefined,
    limit: typeof params.limit === 'string' ? params.limit : undefined,
    search: typeof params.search === 'string' ? params.search : undefined,
    status: typeof params.status === 'string' ? params.status : undefined,
    type: typeof params.type === 'string' ? params.type : undefined,
    partner: typeof params.partner === 'string' ? params.partner : undefined,
  };
}

export default async function ContractsPage({ searchParams }: PageProps) {
  const safeParams = await getSafeParams(searchParams);

  // Fetch data with clean params
  const { contracts, totalCount, totalPages, currentPage } = await getContracts(safeParams);
  const serverTime = await getServerTime();

  // Create stable key for ContractsSection to prevent unnecessary re-mounts
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