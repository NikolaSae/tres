// Path: components/humanitarian-orgs/HumanitarianOrgList.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useHumanitarianOrgs } from "@/hooks/use-humanitarian-orgs";
import { HumanitarianOrgFilters } from "@/components/humanitarian-orgs/HumanitarianOrgFilters";
import { HumanitarianOrgFilterOptions, PaginationOptions } from "@/lib/types/humanitarian-org-types";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function HumanitarianOrgList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Parse filters from URL parameters
  const getFiltersFromURL = useCallback((): HumanitarianOrgFilterOptions => {
    return {
      search: searchParams.get("search") || undefined,
      isActive: searchParams.has("isActive") ? searchParams.get("isActive") === 'true' : undefined,
      country: searchParams.get("country") || undefined,
      city: searchParams.get("city") || undefined,
      hasContracts: searchParams.has("hasContracts") ? searchParams.get("hasContracts") === 'true' : undefined,
      hasComplaints: searchParams.has("hasComplaints") ? searchParams.get("hasComplaints") === 'true' : undefined,
      sortBy: (searchParams.get("sortBy") as HumanitarianOrgFilterOptions['sortBy']) || 'name',
      sortDirection: (searchParams.get("sortDirection") as HumanitarianOrgFilterOptions['sortDirection']) || 'asc',
    };
  }, [searchParams]);

  const getPaginationFromURL = useCallback((): PaginationOptions => {
    return {
      page: parseInt(searchParams.get("page") || "1", 10),
      limit: parseInt(searchParams.get("limit") || "12", 10), // Show 12 items for 4x3 grid
    };
  }, [searchParams]);

  // Initialize state with URL parameters
  const [filters, setFilters] = useState<HumanitarianOrgFilterOptions>(getFiltersFromURL);
  const [pagination, setPagination] = useState<PaginationOptions>(getPaginationFromURL);

  // Fetch data using the current filters and pagination
  const { humanitarianOrgs, totalCount, loading, error, refresh } = useHumanitarianOrgs(
    filters,
    pagination
  );

  const totalPages = Math.ceil(totalCount / pagination.limit);

  // Update state when URL parameters change 
  useEffect(() => {
    setFilters(getFiltersFromURL());
    setPagination(getPaginationFromURL());
  }, [searchParams, getFiltersFromURL, getPaginationFromURL]);

  // Handle filter changes and update URL
  const handleFilterChange = useCallback((filterOptions: HumanitarianOrgFilterOptions) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());

    // Update search params based on filter options
    Object.entries(filterOptions).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        newSearchParams.set(key, String(value));
      } else {
        newSearchParams.delete(key);
      }
    });

    // Always reset to first page when filters change
    newSearchParams.set("page", "1");
    
    router.push(`?${newSearchParams.toString()}`, { scroll: false });
  }, [router, searchParams]);

  // Handle page change
  const handlePageChange = useCallback((newPage: number) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set("page", newPage.toString());
    
    router.push(`?${newSearchParams.toString()}`, { scroll: false });
  }, [searchParams, router]);

  if (loading && humanitarianOrgs.length === 0) {
    return (
      <div className="space-y-4">
        <HumanitarianOrgFilters
          initialFilters={filters}
          onFilterChange={handleFilterChange}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(12)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">Error loading organizations: {error.message}</div>;
  }

  return (
    <div className="space-y-4">
      <HumanitarianOrgFilters
        initialFilters={filters}
        onFilterChange={handleFilterChange}
      />

      {humanitarianOrgs.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-md border">
          <p className="text-gray-500">No organizations found matching your criteria.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {humanitarianOrgs.map((org) => (
              <Card key={org.id} className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="truncate">
                    <Link
                      href={`/humanitarian-orgs/${org.id}`}
                      className="hover:text-blue-600 hover:underline"
                    >
                      {org.name}
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">PIB:</span> {org.pib || 'N/A'}
              </p>
              <p className="text-sm">
                <span className="font-medium">Matični broj:</span> {org.registrationNumber || 'N/A'}
              </p>
              <p className="text-sm">
                <span className="font-medium">Contact:</span> {org.contactPerson || 'N/A'}
              </p>
              <p className="text-sm truncate">
                <span className="font-medium">Email:</span> {org.email || 'N/A'}
              </p>
              <p className="text-sm">
                <span className="font-medium">Phone:</span> {org.phone || 'N/A'}
              </p>
              <div className="flex items-center">
                <span className="font-medium mr-2">Status:</span>
                <Badge variant={org.isActive ? "default" : "destructive"}>
                  {org.isActive ? 'Active' : 'Inactive'}
                </Badge>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between mt-auto">
                  <div className="flex space-x-2">
                    <Badge variant="secondary">
                      Contracts: {org._count?.contracts ?? 0}
                    </Badge>
                    <Badge variant="secondary">
                      Complaints: {org._count?.complaints ?? 0}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => router.push(`/humanitarian-orgs/${org.id}`)}
                  >
                    View
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination className="mt-6">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                    disabled={pagination.page === 1 || loading}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => handlePageChange(pageNum)}
                        isActive={pageNum === pagination.page}
                        disabled={loading}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(Math.min(totalPages, pagination.page + 1))}
                    disabled={pagination.page >= totalPages || loading}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  );
}