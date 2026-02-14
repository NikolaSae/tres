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
  isActive?: boolean | null;
  dateFrom?: Date;
  dateTo?: Date;
}

export function useSenderBlacklist() {
  console.log("[BLACKLIST_HOOK] Hook initialized"); // DEBUG

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

  const handleRefresh = useCallback(() => {
    console.log("[BLACKLIST_HOOK] Refresh triggered"); // DEBUG
    setRefreshKey(prev => prev + 1);
  }, []);

  const handleFilterChange = useCallback((newFilters: BlacklistFilters) => {
    console.log("[BLACKLIST_HOOK] Filters changed:", newFilters); // DEBUG
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    console.log("[BLACKLIST_HOOK] Page changed:", page); // DEBUG
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const fetchBlacklist = useCallback(async (page = 1) => {
    console.log("[BLACKLIST_HOOK] fetchBlacklist called, page:", page); // DEBUG
    
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pagination.pageSize.toString(),
      });

      if (filters.senderName) {
        params.append('senderName', filters.senderName);
      }
      if (filters.isActive !== undefined && filters.isActive !== null) {
  params.append('isActive', filters.isActive.toString());
}

      params.append('refreshKey', refreshKey.toString());

      const url = `/api/sender-blacklist?${params.toString()}`;
      console.log("[BLACKLIST_HOOK] Fetching URL:", url); // DEBUG

      const response = await fetch(url);
      console.log("[BLACKLIST_HOOK] Response status:", response.status); // DEBUG
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("[BLACKLIST_HOOK] Error response:", errorText); // DEBUG
        throw new Error(`Failed to fetch blacklist: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("[BLACKLIST_HOOK] Response data:", data); // DEBUG
      
      setEntries(data.entries || []);
      setPagination({
        page: data.pagination.page,
        pageSize: data.pagination.pageSize,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages,
      });
    } catch (err) {
      console.error("[BLACKLIST_HOOK] Fetch error:", err); // DEBUG
      setError(err instanceof Error ? err.message : "Unknown error");
      setEntries([]);
    } finally {
      console.log("[BLACKLIST_HOOK] Fetch complete, isLoading set to false"); // DEBUG
      setIsLoading(false);
    }
  }, [pagination.pageSize, filters, refreshKey]);

  useEffect(() => {
    console.log("[BLACKLIST_HOOK] useEffect triggered, pagination.page:", pagination.page); // DEBUG
    fetchBlacklist(pagination.page);
  }, [fetchBlacklist, pagination.page]);

  console.log("[BLACKLIST_HOOK] Returning state:", { 
    entriesCount: entries.length, 
    isLoading, 
    error,
    pagination 
  }); // DEBUG

  return {
    entries,
    isLoading,
    error,
    pagination,
    filters,
    totalCount: pagination.total,
    handleFilterChange,
    handlePageChange,
    handleRefresh,
    fetchBlacklist,
  };
}