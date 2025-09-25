///hooks/use-bulk-services.ts


"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { BulkService } from "@prisma/client";
import { BulkServiceWithRelations, BulkServiceFilters } from "@/lib/types/bulk-service-types";

// API functions for bulk services
const API = {
  getAll: async (filters?: BulkServiceFilters): Promise<BulkServiceWithRelations[]> => {
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
    const response = await fetch(`/api/bulk-services${queryString}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch bulk services");
    }
    
    return response.json();
  },
  
  getById: async (id: string): Promise<BulkServiceWithRelations> => {
    const response = await fetch(`/api/bulk-services/${id}`);
    
    if (!response.ok) {
      const error = await response.json();
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
      const error = await response.json();
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
      const error = await response.json();
      throw new Error(error.message || "Failed to update bulk service");
    }
    
    return response.json();
  },
  
  delete: async (id: string): Promise<void> => {
    const response = await fetch(`/api/bulk-services/${id}`, {
      method: "DELETE",
    });
    
    if (!response.ok) {
      const error = await response.json();
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
      const error = await response.json();
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
      const error = await response.json();
      throw new Error(error.message || "Failed to export bulk services");
    }
    
    return response.blob();
  }
};

// Hook for bulk services list with filtering
export function useBulkServices(initialFilters?: BulkServiceFilters) {
  const [bulkServices, setBulkServices] = useState<BulkServiceWithRelations[]>([]);
  const [filters, setFilters] = useState<BulkServiceFilters>(initialFilters || {});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchBulkServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await API.getAll(filters);
      setBulkServices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      toast.error(err instanceof Error ? err.message : "Failed to load bulk services");
    } finally {
      setLoading(false);
    }
  }, [filters]);
  
  useEffect(() => {
    fetchBulkServices();
  }, [fetchBulkServices]);
  
  const updateFilters = useCallback((newFilters: Partial<BulkServiceFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);
  
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);
  
  return {
    bulkServices,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
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
  
  const fetchBulkService = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await API.getById(id);
      setBulkService(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      toast.error(err instanceof Error ? err.message : "Failed to load bulk service");
    } finally {
      setLoading(false);
    }
  }, [id]);
  
  useEffect(() => {
    if (id) {
      fetchBulkService();
    }
  }, [id, fetchBulkService]);
  
  const createBulkService = useCallback(async (data: Omit<BulkService, "id" | "createdAt" | "updatedAt">) => {
    try {
      const newBulkService = await API.create(data);
      toast.success("Bulk service created successfully");
      
      startTransition(() => {
        router.push(`/bulk-services/${newBulkService.id}`);
      });
      
      return newBulkService;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create bulk service");
      throw err;
    }
  }, [router]);
  
  const updateBulkService = useCallback(async (data: Partial<BulkService>) => {
    if (!id || !bulkService) return null;
    
    try {
      const updatedService = await API.update(id, data);
      setBulkService(prev => prev ? { ...prev, ...updatedService } : updatedService);
      toast.success("Bulk service updated successfully");
      return updatedService;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update bulk service");
      throw err;
    }
  }, [id, bulkService]);
  
  const deleteBulkService = useCallback(async () => {
    if (!id) return;
    
    try {
      await API.delete(id);
      toast.success("Bulk service deleted successfully");
      
      startTransition(() => {
        router.push("/bulk-services");
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete bulk service");
      throw err;
    }
  }, [id, router]);
  
  const importBulkServices = useCallback(async (file: File) => {
    try {
      const result = await API.import(file);
      toast.success(`Imported ${result.imported} bulk services successfully${result.errors > 0 ? ` (${result.errors} errors)` : ''}`);
      return result;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to import bulk services");
      throw err;
    }
  }, []);
  
  const exportBulkServices = useCallback(async (filters?: BulkServiceFilters) => {
    try {
      const blob = await API.export(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bulk-services-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Bulk services exported successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to export bulk services");
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