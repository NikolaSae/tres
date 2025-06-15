//components/providers/ProviderList.tsx
"use client";

import { useState, useCallback, useEffect } from "react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { ProviderCard } from "@/components/providers/ProviderCard";
import { ProviderFilters } from "@/components/providers/ProviderFilters";
import { useProviders } from "@/hooks/use-providers";
import { toast } from "sonner";
import ProviderLogList from "@/components/providers/ProviderLogList";
import { useDebounce } from '@/hooks/useDebounce';

export function ProviderList() {
  const {
    providers,
    total,
    pagination,
    loading,
    error,
    setPagination,
    filters,
    setFilters,
    refreshData
  } = useProviders();

  const [actionLoading, setActionLoading] = useState(false);
  const [logRefreshKey, setLogRefreshKey] = useState(0);
  
  // Debounce filter changes
  const debouncedFilters = useDebounce(filters, 300);
  
  // Sync debounced filters with hook
  useEffect(() => {
    if (JSON.stringify(filters) !== JSON.stringify(debouncedFilters)) {
      setFilters(debouncedFilters);
    }
  }, [debouncedFilters, filters, setFilters]);

  const handlePageChange = useCallback((newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  }, [setPagination]);

  const handleFilterChange = useCallback((newFilters: any) => {
    setPagination(prev => ({ ...prev, page: 1 }));
    setFilters(newFilters);
  }, [setPagination, setFilters]);

  const handleStatusChange = useCallback(async (id: string, isActive: boolean) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/providers/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });

      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.statusText}`);
      }

      toast.success(`Provider ${isActive ? 'activated' : 'deactivated'} successfully`);
      refreshData();
      setLogRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update provider status");
    } finally {
      setActionLoading(false);
    }
  }, [refreshData]);

  const handleRenewContract = useCallback(async (id: string) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/providers/${id}/renew-contract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Failed to renew contract: ${response.statusText}`);
      }

      toast.success("Contract renewed successfully");
      refreshData();
      setLogRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error(error);
      toast.error("Failed to renew contract");
    } finally {
      setActionLoading(false);
    }
  }, [refreshData]);

  const triggerLogRefresh = useCallback(() => {
    setLogRefreshKey(prev => prev + 1);
  }, []);

  if (loading && providers.length === 0) {
    return <div className="text-center py-4">Loading providers...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">{error}</div>;
  }

  const totalPages = Math.ceil(total / pagination.limit);

  return (
    <div className="space-y-4">
      <ProviderFilters
        initialFilters={filters}
        onFilterChange={handleFilterChange}
      />

      {providers.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-md border">
          <p className="text-gray-500">No providers found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {providers.map(provider => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              onStatusChange={handleStatusChange}
              onRenewContract={handleRenewContract}
              triggerLogRefresh={triggerLogRefresh}
              disabled={actionLoading}
            />
          ))}
        </div>
      )}

      {total > pagination.limit && totalPages > 1 && (
        <Pagination className="mt-6">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                disabled={pagination.page === 1 || loading || actionLoading}
              />
            </PaginationItem>
            {Array.from({ length: Math.min(5, totalPages) }).map((_, index) => {
              const pageNum = index + 1;
              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={() => handlePageChange(pageNum)}
                    isActive={pageNum === pagination.page}
                    disabled={loading || actionLoading}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChange(Math.min(totalPages, pagination.page + 1))}
                disabled={pagination.page >= totalPages || loading || actionLoading}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <div className="mt-8">
        <ProviderLogList logRefreshKey={logRefreshKey} />
      </div>
    </div>
  );
}