// hooks/use-contracts.ts

"use client";

import { useState, useEffect, useCallback } from "react";
import { ContractStatus, ContractType } from "@prisma/client";

interface Provider {
  id: string;
  name: string;
}

interface HumanitarianOrg {
  id: string;
  name: string;
}

interface ParkingService {
  id: string;
  name: string;
}

interface Contract {
  id: string;
  name: string;
  contractNumber: string;
  type: ContractType;
  status: ContractStatus;
  startDate: Date;
  endDate: Date;
  revenuePercentage: number;
  description?: string | null;
  provider?: Provider | null;
  humanitarianOrg?: HumanitarianOrg | null;
  parkingService?: ParkingService | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: {
    id: string;
    name: string | null;
  };
  lastModifiedBy?: {
    id: string;
    name: string | null;
  } | null;
  _count?: {
    services: number;
    attachments: number;
    reminders: number;
  };
}

interface FilterOptions {
  type?: ContractType | null;
  status?: ContractStatus | null;
  providerId?: string | null;
  humanitarianOrgId?: string | null;
  parkingServiceId?: string | null;
  search?: string | null;
  expiringWithin?: number | null; // Days until expiration
}

interface UseContractsOptions {
  initialData?: Contract[];
  fetchOnMount?: boolean;
  filters?: FilterOptions;
  limit?: number;
}

interface UpdateContractStatusData {
  status: ContractStatus;
  notes?: string;
}

interface UseContractsResult {
  contracts: Contract[];
  loading: boolean;
  error: Error | null;
  fetchContracts: (filters?: FilterOptions) => Promise<void>;
  refreshContracts: () => Promise<void>;
  updateContractStatus: (contractId: string, data: UpdateContractStatusData) => Promise<{ success: boolean; error?: string; renewalId?: string }>;
  totalCount: number;
  filterContracts: (filters: FilterOptions) => void;
  filteredContracts: Contract[];
  activeFilters: FilterOptions;
}

export function useContracts({
  initialData = [],
  fetchOnMount = true,
  filters: initialFilters = {},
  limit
}: UseContractsOptions = {}): UseContractsResult {
  const [contracts, setContracts] = useState<Contract[]>(initialData);
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>(initialData);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState<number>(initialData.length);
  const [activeFilters, setActiveFilters] = useState<FilterOptions>(initialFilters);

  const buildQueryString = (filters: FilterOptions) => {
    const params = new URLSearchParams();
    
    if (filters.type) params.append('type', filters.type);
    if (filters.status) params.append('status', filters.status);
    if (filters.providerId) params.append('providerId', filters.providerId);
    if (filters.humanitarianOrgId) params.append('humanitarianOrgId', filters.humanitarianOrgId);
    if (filters.parkingServiceId) params.append('parkingServiceId', filters.parkingServiceId);
    if (filters.search) params.append('search', filters.search);
    if (filters.expiringWithin) params.append('expiringWithin', filters.expiringWithin.toString());
    if (limit) params.append('limit', limit.toString());
    
    return params.toString();
  };

  const fetchContracts = useCallback(async (newFilters?: FilterOptions) => {
    const filtersToUse = newFilters || activeFilters;
    
    try {
      setLoading(true);
      setError(null);
      
      const queryString = buildQueryString(filtersToUse);
      const response = await fetch(`/api/contracts?${queryString}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch contracts: ${response.status}`);
      }
      
      const data = await response.json();
      setContracts(data.contracts);
      setFilteredContracts(data.contracts);
      setTotalCount(data.totalCount);
      setActiveFilters(filtersToUse);
    } catch (err) {
      console.error("Error fetching contracts:", err);
      setError(err instanceof Error ? err : new Error('Failed to fetch contracts'));
    } finally {
      setLoading(false);
    }
  }, [activeFilters, limit]);

  const refreshContracts = useCallback(() => {
    return fetchContracts(activeFilters);
  }, [fetchContracts, activeFilters]);

  // Nova funkcija za ažuriranje statusa ugovora
  const updateContractStatus = useCallback(async (contractId: string, data: UpdateContractStatusData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/contracts/${contractId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update contract status: ${response.status}`);
      }

      const result = await response.json();
      
      // Ažuriraj lokalno stanje
      setContracts(prev => prev.map(contract => 
        contract.id === contractId 
          ? { ...contract, status: data.status, updatedAt: new Date() }
          : contract
      ));
      
      setFilteredContracts(prev => prev.map(contract => 
        contract.id === contractId 
          ? { ...contract, status: data.status, updatedAt: new Date() }
          : contract
      ));

      return { 
        success: true, 
        renewalId: result.renewalId // Vraćamo ID kreiranog renewal-a ako postoji
      };
    } catch (err) {
      console.error("Error updating contract status:", err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update contract status';
      setError(new Error(errorMessage));
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Client-side filtering function
  const filterContracts = useCallback((filters: FilterOptions) => {
    setActiveFilters(filters);
    
    let result = [...contracts];
    
    // Apply type filter
    if (filters.type) {
      result = result.filter(contract => contract.type === filters.type);
    }
    
    // Apply status filter
    if (filters.status) {
      result = result.filter(contract => contract.status === filters.status);
    }
    
    // Apply provider filter
    if (filters.providerId) {
      result = result.filter(contract => contract.provider?.id === filters.providerId);
    }
    
    // Apply humanitarian org filter
    if (filters.humanitarianOrgId) {
      result = result.filter(contract => contract.humanitarianOrg?.id === filters.humanitarianOrgId);
    }
    
    // Apply parking service filter
    if (filters.parkingServiceId) {
      result = result.filter(contract => contract.parkingService?.id === filters.parkingServiceId);
    }
    
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(contract => 
        contract.name.toLowerCase().includes(searchLower) ||
        contract.contractNumber.toLowerCase().includes(searchLower) ||
        contract.provider?.name.toLowerCase().includes(searchLower) ||
        contract.humanitarianOrg?.name.toLowerCase().includes(searchLower) ||
        contract.parkingService?.name.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply expiring within filter
    if (filters.expiringWithin) {
      const today = new Date();
      const expiryLimit = new Date();
      expiryLimit.setDate(today.getDate() + filters.expiringWithin);
      
      result = result.filter(contract => {
        const endDate = new Date(contract.endDate);
        return endDate >= today && endDate <= expiryLimit;
      });
    }
    
    setFilteredContracts(result);
  }, [contracts]);

  // Fetch contracts on mount if specified
  useEffect(() => {
    if (fetchOnMount && (!initialData || initialData.length === 0)) {
      fetchContracts(initialFilters);
    }
  }, [fetchOnMount, fetchContracts, initialData, initialFilters]);

  return {
    contracts,
    loading,
    error,
    fetchContracts,
    refreshContracts,
    updateContractStatus, // Nova funkcija
    totalCount,
    filterContracts,
    filteredContracts,
    activeFilters
  };
}