// hooks/use-operators.ts

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { OperatorWithContractCount, OperatorFilters, OperatorPaginationParams } from "@/lib/types/operator-types";

interface UseOperatorsOptions {
  initialPage?: number;
  initialLimit?: number;
  initialFilters?: OperatorFilters;
  fetchOnMount?: boolean;
}

interface OperatorsResponse {
  data: OperatorWithContractCount[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export function useOperators(options: UseOperatorsOptions = {}) {
  const {
    initialPage = 1,
    initialLimit = 10,
    initialFilters = {},
    fetchOnMount = true,
  } = options;

  const [operators, setOperators] = useState<OperatorWithContractCount[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    pages: 0,
  });
  const [filters, setFilters] = useState<OperatorFilters>(initialFilters);
  const { toast } = useToast();

  const fetchOperators = async (params?: OperatorPaginationParams) => {
    try {
      setLoading(true);
      setError(null);

      const page = params?.page || pagination.page;
      const limit = params?.limit || pagination.limit;
      const currentFilters = params?.filters || filters;

      // Construct query parameters
      const queryParams = new URLSearchParams();
      queryParams.append("page", page.toString());
      queryParams.append("limit", limit.toString());

      if (currentFilters.name) queryParams.append("name", currentFilters.name);
      if (currentFilters.code) queryParams.append("code", currentFilters.code);
      if (currentFilters.active !== undefined) queryParams.append("active", currentFilters.active.toString());
      if (currentFilters.sort) queryParams.append("sort", currentFilters.sort);
      if (currentFilters.order) queryParams.append("order", currentFilters.order);

      const response = await fetch(`/api/operators?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch operators");
      }

      const data: OperatorsResponse = await response.json();

      setOperators(data.data);
      setPagination({
        page: data.meta.page,
        limit: data.meta.limit,
        total: data.meta.total,
        pages: data.meta.pages,
      });

      if (params?.filters) {
        setFilters(params.filters);
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred while fetching operators";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchOperatorById = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/operators/${id}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch operator");
      }

      const { data } = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred while fetching operator";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchOperatorContracts = async (id: string, page = 1, limit = 10, status?: string) => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      queryParams.append("page", page.toString());
      queryParams.append("limit", limit.toString());
      if (status) queryParams.append("status", status);

      const response = await fetch(`/api/operators/${id}/contracts?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch operator contracts");
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred while fetching operator contracts";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Fetch operators on component mount if fetchOnMount is true
  useEffect(() => {
    if (fetchOnMount) {
      fetchOperators();
    }
  }, [fetchOnMount]);

  return {
    operators,
    loading,
    error,
    pagination,
    filters,
    fetchOperators,
    fetchOperatorById,
    fetchOperatorContracts,
    setFilters,
  };
}