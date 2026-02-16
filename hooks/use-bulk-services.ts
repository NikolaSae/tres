// hooks/use-bulk-services.ts
"use client";

import { useState, useEffect, useCallback, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BulkService } from "@prisma/client";
import { BulkServiceWithRelations, BulkServiceFilters } from "@/lib/types/bulk-service-types";

// API response type for paginated data
interface BulkServicesApiResponse {
  data: BulkServiceWithRelations[];
  meta: {
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// API error type
interface ApiError {
  message: string;
  details?: any;
}

// API functions with better error handling
const API = {
  getAll: async (
    filters?: BulkServiceFilters,
    pagination?: { page: number; limit: number },
    signal?: AbortSignal
  ): Promise<BulkServicesApiResponse> => {
    const params = new URLSearchParams();
    
    // Add pagination params
    if (pagination) {
      params.append("page", pagination.page.toString());
      params.append("limit", pagination.limit.toString());
    }
    
    // Add filter params
    if (filters) {
      if (filters.providerId) params.append("providerId", filters.providerId);
      if (filters.serviceId) params.append("serviceId", filters.serviceId);
      if (filters.providerName) params.append("providerName", filters.providerName);
      if (filters.serviceName) params.append("serviceName", filters.serviceName);
      if (filters.senderName) params.append("senderName", filters.senderName);
      if (filters.startDate) params.append("startDate", filters.startDate.toISOString());
      if (filters.endDate) params.append("endDate", filters.endDate.toISOString());
    }
    
    const queryString = params.toString() ? `?${params.toString()}` : "";
    const response = await fetch(`/api/bulk-services${queryString}`, {
      signal,
      // Enable caching on client side
      next: { revalidate: 60 }
    });
    
    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({ 
        message: "Failed to fetch bulk services" 
      }));
      throw new Error(error.message || "Failed to fetch bulk services");
    }
    
    return response.json();
  },
  
  getById: async (id: string, signal?: AbortSignal): Promise<BulkServiceWithRelations> => {
    const response = await fetch(`/api/bulk-services/${id}`, {
      signal,
      // Enable caching
      next: { revalidate: 120 }
    });
    
    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({ 
        message: "Failed to fetch bulk service" 
      }));
      throw new Error(error.message || "Failed to fetch bulk service");
    }
    
    return response.json();
  },
  
  create: async (data: Omit<BulkService, "id" | "createdAt" | "updatedAt">): Promise<BulkService> => {
    const response = await fetch("/api/bulk-services", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({ 
        message: "Failed to create bulk service" 
      }));
      throw new Error(error.message || "Failed to create bulk service");
    }
    
    return response.json();
  },
  
  update: async (id: string, data: Partial<BulkService>): Promise<BulkService> => {
    const response = await fetch(`/api/bulk-services/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({ 
        message: "Failed to update bulk service" 
      }));
      throw new Error(error.message || "Failed to update bulk service");
    }
    
    return response.json();
  },
  
  delete: async (id: string): Promise<void> => {
    const response = await fetch(`/api/bulk-services/${id}`, {
      method: "DELETE",
    });
    
    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({ 
        message: "Failed to delete bulk service" 
      }));
      throw new Error(error.message || "Failed to delete bulk service");
    }
  },
  
  import: async (file: File): Promise<{ imported: number; errors: number }> => {
    const formData = new FormData();
    formData.append("file", file);
    
    const response = await fetch("/api/bulk-services/import", {
      method: "POST",
      body: formData,
    });
    
    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({ 
        message: "Failed to import bulk services" 
      }));
      throw new Error(error.message || "Failed to import bulk services");
    }
    
    return response.json();
  },
  
  export: async (filters?: BulkServiceFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.providerId) params.append("providerId", filters.providerId);
      if (filters.serviceId) params.append("serviceId", filters.serviceId);
      if (filters.providerName) params.append("providerName", filters.providerName);
      if (filters.serviceName) params.append("serviceName", filters.serviceName);
      if (filters.senderName) params.append("senderName", filters.senderName);
      if (filters.startDate) params.append("startDate", filters.startDate.toISOString());
      if (filters.endDate) params.append("endDate", filters.endDate.toISOString());
    }
    
    const queryString = params.toString() ? `?${params.toString()}` : "";
    const response = await fetch(`/api/bulk-services/export${queryString}`);
    
    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({ 
        message: "Failed to export bulk services" 
      }));
      throw new Error(error.message || "Failed to export bulk services");
    }
    
    return response.blob();
  }
};

// Hook for bulk services list with filtering and pagination
export function useBulkServices(
  initialFilters?: BulkServiceFilters,
  initialPagination: { page: number; limit: number } = { page: 1, limit: 10 }
) {
  const [bulkServices, setBulkServices] = useState<BulkServicesApiResponse | null>(null);
  const [filters, setFilters] = useState<BulkServiceFilters>(initialFilters || {});
  const [pagination, setPaginationState] = useState(initialPagination);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // AbortController for request cancellation
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const fetchBulkServices = useCallback(async () => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new AbortController
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await API.getAll(filters, pagination, abortControllerRef.current.signal);
      setBulkServices(data);
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination]);
  
  useEffect(() => {
    fetchBulkServices();
    
    // Cleanup: abort request on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchBulkServices]);
  
  const updateFilters = useCallback((newFilters: Partial<BulkServiceFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    // Reset to page 1 when filters change
    setPaginationState(prev => ({ ...prev, page: 1 }));
  }, []);
  
  const clearFilters = useCallback(() => {
    setFilters({});
    setPaginationState(prev => ({ ...prev, page: 1 }));
  }, []);
  
  const setPagination = useCallback((newPagination: { page: number; limit: number }) => {
    setPaginationState(newPagination);
  }, []);
  
  return {
    bulkServices,
    loading,
    error,
    filters,
    pagination,
    updateFilters,
    clearFilters,
    setPagination,
    refresh: fetchBulkServices
  };
}

// Hook for single bulk service management
export function useBulkService(id?: string) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  const [bulkService, setBulkService] = useState<BulkServiceWithRelations | null>(null);
  const [loading, setLoading] = useState(id ? true : false);
  const [error, setError] = useState<string | null>(null);
  
  // AbortController for request cancellation
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const fetchBulkService = useCallback(async () => {
    if (!id) return;
    
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new AbortController
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await API.getById(id, abortControllerRef.current.signal);
      setBulkService(data);
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [id]);
  
  useEffect(() => {
    if (id) {
      fetchBulkService();
    }
    
    // Cleanup: abort request on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [id, fetchBulkService]);
  
  const createBulkService = useCallback(async (data: Omit<BulkService, "id" | "createdAt" | "updatedAt">) => {
    try {
      const newBulkService = await API.create(data);
      toast.success("Bulk service created successfully");
      
      startTransition(() => {
        router.push(`/bulk-services/${newBulkService.id}`);
        router.refresh(); // Trigger server component refresh
      });
      
      return newBulkService;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create bulk service";
      toast.error(errorMessage);
      throw err;
    }
  }, [router]);
  
  const updateBulkService = useCallback(async (data: Partial<BulkService>) => {
    if (!id || !bulkService) return null;
    
    try {
      // Optimistic update
      const previousBulkService = bulkService;
      setBulkService(prev => prev ? { ...prev, ...data } as BulkServiceWithRelations : null);
      
      const updatedService = await API.update(id, data);
      
      // Update with server response
      setBulkService(prev => {
        if (!prev) return null;
        return {
          ...prev,
          ...updatedService,
          // Preserve the relations from previous state
          provider: prev.provider,
          service: prev.service,
        };
      });
      
      toast.success("Bulk service updated successfully");
      
      // Trigger router refresh to update server components
      router.refresh();
      
      return updatedService;
    } catch (err) {
      // Rollback optimistic update on error
      setBulkService(bulkService);
      
      const errorMessage = err instanceof Error ? err.message : "Failed to update bulk service";
      toast.error(errorMessage);
      throw err;
    }
  }, [id, bulkService, router]);
  
  const deleteBulkService = useCallback(async () => {
    if (!id) return;
    
    try {
      await API.delete(id);
      toast.success("Bulk service deleted successfully");
      
      startTransition(() => {
        router.push("/bulk-services");
        router.refresh(); // Trigger server component refresh
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete bulk service";
      toast.error(errorMessage);
      throw err;
    }
  }, [id, router]);
  
  const importBulkServices = useCallback(async (file: File) => {
    try {
      const result = await API.import(file);
      const message = `Imported ${result.imported} bulk services successfully${
        result.errors > 0 ? ` (${result.errors} errors)` : ''
      }`;
      toast.success(message);
      
      // Trigger router refresh to update server components
      router.refresh();
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to import bulk services";
      toast.error(errorMessage);
      throw err;
    }
  }, [router]);
  
  const exportBulkServices = useCallback(async (filters?: BulkServiceFilters) => {
    try {
      const blob = await API.export(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bulk-services-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
      toast.success("Bulk services exported successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to export bulk services";
      toast.error(errorMessage);
      throw err;
    }
  }, []);
  
  return {
    bulkService,
    loading,
    error,
    isPending,
    createBulkService,
    updateBulkService,
    deleteBulkService,
    importBulkServices,
    exportBulkServices,
    refresh: fetchBulkService
  };
}

export default {
  useBulkServices,
  useBulkService
};