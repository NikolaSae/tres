// hooks/use-sender-blacklist.ts
// hooks/use-sender-blacklist.ts
import { useState, useEffect, useCallback } from "react";
import { SenderBlacklistWithProvider } from "@/lib/types/blacklist";

export interface BlacklistPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface BlacklistFilters {
  senderName?: string;
  providerId?: string;
  isActive?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

export function useSenderBlacklist() {
  const [entries, setEntries] = useState<SenderBlacklistWithProvider[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<BlacklistPagination>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
  });
  const [filters, setFilters] = useState<BlacklistFilters>({});
  const [refreshKey, setRefreshKey] = useState(0);

  // Add refresh function
  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: BlacklistFilters) => {
    setFilters(newFilters);
    // Reset to first page when filters change
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Handle page changes
  const handlePageChange = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const fetchBlacklist = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pagination.pageSize.toString(),
      });

      // Add filters to params
      if (filters.senderName) {
        params.append('senderName', filters.senderName);
      }
      if (filters.providerId) {
        params.append('providerId', filters.providerId);
      }
      if (filters.isActive !== undefined) {
        params.append('isActive', filters.isActive.toString());
      }
      if (filters.dateFrom) {
        params.append('dateFrom', filters.dateFrom.toISOString());
      }
      if (filters.dateTo) {
        params.append('dateTo', filters.dateTo.toISOString());
      }

      params.append('refreshKey', refreshKey.toString());

      const response = await fetch(`/api/sender-blacklist?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch blacklist: ${response.statusText}`);
      }

      const data = await response.json();
      
      setEntries(data.entries || []);
      setPagination({
        page: data.pagination.page,
        pageSize: data.pagination.pageSize,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages,
      });
    } catch (err) {
      console.error("Fetch blacklist error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setEntries([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  }, [pagination.pageSize, filters, refreshKey]);

  useEffect(() => {
    fetchBlacklist(pagination.page);
  }, [fetchBlacklist, pagination.page]);

  // Calculate total count for display
  const totalCount = pagination.total;

  return {
    entries,
    isLoading,
    error,
    pagination,
    filters,
    totalCount,
    handleFilterChange,
    handlePageChange,
    handleRefresh,
    fetchBlacklist,
  };
}