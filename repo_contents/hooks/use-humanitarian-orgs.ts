// Path: hooks/use-humanitarian-orgs.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  HumanitarianOrgWithDetails,
  HumanitarianOrgFilterOptions,
  PaginationOptions
} from "@/lib/types/humanitarian-org-types";
import { getHumanitarianOrgs } from "@/actions/humanitarian-orgs/get";

export function useHumanitarianOrgs(
  filters: HumanitarianOrgFilterOptions = {},
  pagination: PaginationOptions = { page: 1, limit: 10 }
) {
  // Data state
  const [humanitarianOrgs, setHumanitarianOrgs] = useState<HumanitarianOrgWithDetails[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Create a stable reference for comparing objects
  const filterKey = JSON.stringify(filters);
  const paginationKey = JSON.stringify(pagination);
  
  // Fetch organizations based on current filters and pagination
  const fetchOrgs = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Server Action call
      const result = await getHumanitarianOrgs({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });
      
      if (result.error) {
        setError(new Error(result.error));
        setHumanitarianOrgs([]);
        setTotalCount(0);
      } else {
        setHumanitarianOrgs(result.data);
        setTotalCount(result.total);
      }
    } catch (err) {
      console.error("Error fetching humanitarian organizations:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch humanitarian organizations"));
      setHumanitarianOrgs([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination]);
  
  // Fetch data whenever filters or pagination changes
  useEffect(() => {
    fetchOrgs();
  }, [filterKey, paginationKey, fetchOrgs]);
  
  // Method to manually refresh data with current filters
  const refresh = useCallback(() => {
    fetchOrgs();
  }, [fetchOrgs]);
  
  return {
    humanitarianOrgs,
    totalCount,
    loading,
    error,
    refresh
  };
}