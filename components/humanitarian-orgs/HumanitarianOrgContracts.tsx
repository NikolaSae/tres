// /components/humanitarian-orgs/HumanitarianOrgContracts.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationPrevious, 
  PaginationNext,
  PaginationEllipsis 
} from "@/components/ui/pagination";
import { AlertCircle, Clock, FileText } from "lucide-react";

interface Contract {
  id: string;
  name: string;
  contractNumber: string;
  status: "ACTIVE" | "EXPIRED" | "PENDING" | "RENEWAL_IN_PROGRESS";
  startDate: string | Date;
  endDate: string | Date;
  revenuePercentage: number;
  type: "HUMANITARIAN";
}

interface HumanitarianOrgContractsProps {
  organizationId: string | undefined;
  organizationName: string;
}

export function HumanitarianOrgContracts({ organizationId, organizationName }: HumanitarianOrgContractsProps) {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => {
    console.log(`[HumanitarianOrgContracts] organizationId prop value:`, organizationId);
  }, [organizationId]);

  const loadContracts = useCallback(async (page = 1) => {
    console.log(`[HumanitarianOrgContracts] Attempting to load contracts for ID: ${organizationId}, page: ${page}`);
    setIsLoading(true);
    setError(null);

    if (!organizationId) {
      console.warn("[HumanitarianOrgContracts] loadContracts called with missing organizationId. Skipping fetch.");
      setIsLoading(false);
      setError("Organization ID is missing.");
      setContracts([]);
      setTotalPages(1);
      setTotalResults(0);
      setCurrentPage(1);
      return;
    }

    try {
      const response = await fetch(`/api/humanitarian-orgs/${organizationId}/contracts?page=${page}&limit=5`);

      console.log(`[HumanitarianOrgContracts] API Response Status: ${response.status}`);

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const errorMessage = errorBody.error || `Failed to load contracts: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("[HumanitarianOrgContracts] API Response Data:", data);

      setContracts(data.items || []);
      setTotalPages(data.totalPages || 1);
      setTotalResults(data.total || 0);
      setCurrentPage(page);
    } catch (err) {
      console.error("[HumanitarianOrgContracts] Error loading contracts:", err);
      setError(err instanceof Error ? err.message : "Failed to load contracts. Please try again later.");
      setContracts([]);
      setTotalPages(1);
      setTotalResults(0);
      setCurrentPage(1);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    if (organizationId) {
      console.log("[HumanitarianOrgContracts] organizationId is defined, triggering loadContracts.");
      loadContracts(1);
    } else {
      console.log("[HumanitarianOrgContracts] organizationId is undefined, waiting...");
      setIsLoading(true);
      setError(null);
      setContracts([]);
      setTotalPages(1);
      setTotalResults(0);
      setCurrentPage(1);
    }
  }, [organizationId, loadContracts]);

  const handlePageChange = (page: number) => {
    if (organizationId) {
      loadContracts(page);
    }
  };

  const renderStatusBadge = (status: Contract['status']) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-500 hover:bg-green-500">Active</Badge>;
      case 'EXPIRED':
        return <Badge className="bg-red-500 hover:bg-red-500">Expired</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-500 hover:bg-yellow-500">Pending</Badge>;
      case 'RENEWAL_IN_PROGRESS':
        return <Badge className="bg-blue-500 hover:bg-blue-500">Renewal in Progress</Badge>;
      default:
        return <Badge className="bg-gray-500 hover:bg-gray-500">Unknown</Badge>;
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-2xl font-bold">Contracts</CardTitle>
        {organizationId && !isLoading && (
          <Button
            onClick={() => router.push(`/contracts/new?orgId=${organizationId}&orgName=${encodeURIComponent(organizationName)}`)}
          >
            Add Contract
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading && organizationId && !error ? (
          <div className="flex justify-center p-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Loading contracts...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        ) : contracts.length === 0 && organizationId && !isLoading ? (
          <div className="text-center p-6 border border-dashed rounded-md">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <h3 className="text-lg font-medium mb-1">No contracts found</h3>
            <p className="text-gray-500 mb-4">This organization doesn't have any contracts yet.</p>
            {organizationId && (
              <Button
                onClick={() => router.push(`/contracts/new?orgId=${organizationId}&orgName=${encodeURIComponent(organizationName)}`)}
              >
                Add First Contract
              </Button>
            )}
          </div>
        ) : !organizationId && !isLoading ? (
          <div className="text-center p-6 text-muted-foreground">
            Organization ID is missing. Cannot load contracts.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm table-auto">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 sm:px-3">Contract Name</th>
                    <th className="text-left py-2 px-2 sm:px-3 hidden sm:table-cell">Contract No.</th>
                    <th className="text-left py-2 px-2 sm:px-3">Status</th>
                    <th className="text-left py-2 px-2 sm:px-3">Period</th>
                    <th className="text-left py-2 px-2 sm:px-3 hidden md:table-cell">Revenue %</th>
                    <th className="text-left py-2 px-2 sm:px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((contract) => (
                    <tr key={contract.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-2 sm:px-3 max-w-[150px] truncate">
                        <Link href={`/contracts/${contract.id}`} className="text-blue-600 hover:underline">
                          {contract.name}
                        </Link>
                      </td>
                      <td className="py-2 px-2 sm:px-3 hidden sm:table-cell">{contract.contractNumber}</td>
                      <td className="py-2 px-2 sm:px-3">{renderStatusBadge(contract.status)}</td>
                      <td className="py-2 px-2 sm:px-3">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                          <Clock className="h-4 w-4 text-gray-500 hidden sm:inline" />
                          <span className="whitespace-nowrap">
                            {formatDate(contract.startDate)} 
                            <span className="hidden sm:inline"> - </span>
                            <br className="sm:hidden" />
                            {formatDate(contract.endDate)}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-2 sm:px-3 hidden md:table-cell">{contract.revenuePercentage}%</td>
                      <td className="py-2 px-2 sm:px-3">
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/contracts/${contract.id}`)}
                          >
                            <span className="hidden sm:inline">View</span>
                            <span className="sm:hidden">👁️</span>
                          </Button>
                          {contract.status === 'ACTIVE' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/contracts/${contract.id}/edit`)}
                            >
                              <span className="hidden sm:inline">Edit</span>
                              <span className="sm:hidden">✏️</span>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <Pagination className="mt-6">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) handlePageChange(currentPage - 1);
                      }}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  
                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    // Show first page, last page, current page, and pages around current
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(page);
                            }}
                            isActive={currentPage === page}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) handlePageChange(currentPage + 1);
                      }}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}

            <div className="text-sm text-gray-500 mt-4 text-center">
              Showing {contracts.length} of {totalResults} contracts
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}