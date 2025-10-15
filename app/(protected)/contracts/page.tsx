// Path: /app/(protected)/contracts/page.tsx
import { Metadata } from "next";
import Link from "next/link";
import { ContractsSection } from "@/components/contracts/ContractsSection";
import { PlusCircle, FileSpreadsheet, Clock } from "lucide-react";
import { db } from "@/lib/db";
import { Contract as ContractType, ContractStatus, ContractType as PrismaContractType } from "@prisma/client";

export const metadata: Metadata = {
  title: "Contracts Management | Management Dashboard",
  description: "View and manage all contracts with advanced filtering and search capabilities.",
};

async function getContracts(searchParams: {
  page?: string;
  limit?: string;
  search?: string;
  status?: string;
  type?: string;
  partner?: string;
}): Promise<{
  contracts: ContractType[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  useServerPagination: boolean;
}> {
  try {
    const page = parseInt(searchParams.page || '1');
    const limit = parseInt(searchParams.limit || '25');

    const hasServerFilters = Boolean(
      searchParams.search?.trim() ||
      (searchParams.status && Object.values(ContractStatus).includes(searchParams.status as ContractStatus)) ||
      (searchParams.type && Object.values(ContractType).includes(searchParams.type as ContractType)) ||
      searchParams.partner
    );

    const where: any = {};
    const conditions = [];

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

    if (searchParams.status && Object.values(ContractStatus).includes(searchParams.status as ContractStatus)) {
      conditions.push({ status: searchParams.status });
    }

    if (searchParams.type && Object.values(ContractType).includes(searchParams.type as ContractType)) {
      conditions.push({ type: searchParams.type });
    }

    if (searchParams.partner) {
      conditions.push({
        OR: [
          { providerId: searchParams.partner },
          { humanitarianOrgId: searchParams.partner },
          { parkingServiceId: searchParams.partner }
        ]
      });
    }

    if (conditions.length > 0) {
      where.AND = conditions;
    }

    if (hasServerFilters) {
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
        currentPage: page,
        useServerPagination: true
      };
    } else {
      const contracts = await db.contract.findMany({
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
      });

      return {
        contracts,
        totalCount: contracts.length,
        totalPages: Math.ceil(contracts.length / limit),
        currentPage: page,
        useServerPagination: false
      };
    }
  } catch (error) {
    console.error('Error fetching contracts:', error);
    return {
      contracts: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: parseInt(searchParams.page || '1'),
      useServerPagination: false
    };
  }
}

async function getServerTime() {
  return new Date().toISOString();
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const dynamic = 'auto';

async function getSafeParams(searchParams: { [key: string]: string | string[] | undefined }) {
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
  const resolvedSearchParams = await searchParams;
  const safeParams = await getSafeParams(resolvedSearchParams);

  const { contracts, totalCount, totalPages, currentPage, useServerPagination } = await getContracts(safeParams);
  const serverTime = await getServerTime();

  const sectionKey = JSON.stringify(safeParams);

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header Section with Gradient Background */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="space-y-3 flex-1">
            <h1 className="text-4xl font-bold tracking-wide text-gray-900 dark:text-gray-100">
              Contracts Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
              Manage all contracts in the system. Use filters to quickly find specific contracts by type, status, partner, or search terms.
            </p>
            
            {/* Status Legend with Modern Design */}
            <div className="flex flex-wrap items-center gap-4 pt-3">
              <span className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Active
              </span>
              <span className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                Draft
              </span>
              <span className="flex items-center gap-2 text-sm font-medium text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                Pending
              </span>
              <span className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                Expired
              </span>
            </div>
            
            {/* Debug Info - Optional, can be removed in production */}
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <span className="font-mono">
                Debug: Total contracts loaded: {contracts.length} | 
                Server pagination: {useServerPagination ? 'Yes' : 'No'} |
                Has filters: {Object.values(safeParams).some(v => v) ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
          
          {/* Action Buttons with New Styles */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:min-w-[400px]">
            {/* Import Contracts - Chrome Polish */}
            <Link
              href="/contracts/import"
              className="relative inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 ease-in-out overflow-hidden text-white bg-gradient-to-r from-gray-500 to-gray-700 hover:from-gray-600 hover:to-gray-800 shadow-lg shadow-gray-500/30 hover:shadow-xl hover:shadow-gray-500/40 hover:-translate-y-0.5 active:translate-y-0 order-3 sm:order-1"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Import
            </Link>
            
            {/* Expiring Contracts - Fire Ember */}
            <Link
              href="/contracts/expiring"
              className="relative inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 ease-in-out overflow-hidden text-white bg-gradient-to-r from-orange-600 via-red-500 to-orange-400 hover:from-orange-700 hover:via-red-600 hover:to-orange-500 shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-0.5 active:translate-y-0 order-2 sm:order-2"
            >
              <Clock className="mr-2 h-4 w-4" />
              Expiring
            </Link>
            
            {/* Create Contract - Deep Ocean (Primary) */}
            <Link
              href="/contracts/new"
              className="relative inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 ease-in-out overflow-hidden text-white bg-gradient-to-r from-blue-900 via-blue-800 to-blue-600 hover:from-blue-950 hover:via-blue-900 hover:to-blue-700 shadow-lg shadow-blue-600/40 hover:shadow-xl hover:shadow-blue-600/50 hover:-translate-y-0.5 active:translate-y-0 order-1 sm:order-3"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Contract
            </Link>
          </div>
        </div>

        {/* Contracts Section */}
        <ContractsSection 
          key={sectionKey}
          initialContracts={contracts}
          serverTime={serverTime}
          initialTotalCount={totalCount}
          initialTotalPages={totalPages}
          initialCurrentPage={currentPage}
          useServerPagination={useServerPagination}
        />

        {/* Help Section with Modern Design */}
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 text-center shadow-sm">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Need help managing contracts? Check out our{" "}
            <Link 
              href="/help/contracts" 
              className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline decoration-2 underline-offset-2 transition-colors"
            >
              documentation
            </Link>{" "}
            or{" "}
            <Link 
              href="/support" 
              className="font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 underline decoration-2 underline-offset-2 transition-colors"
            >
              contact support
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}