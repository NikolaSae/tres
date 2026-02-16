// components/providers/ProviderListClient.tsx
"use client";

import { useState, useMemo } from "react";
import { ProviderCard } from "@/components/providers/ProviderCard";
import { ProviderFilters } from "@/components/providers/ProviderFilters";
import { toast } from "sonner";
import ProviderLogList from "@/components/providers/ProviderLogList";
import { useRouter } from "next/navigation";

interface Provider {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  imageUrl: string | null;
  address: string | null;
  // ✅ Dodaj _count
  _count: {
    contracts: number;
    complaints: number;
    vasServices: number;
    bulkServices: number;
  };
}

interface ProviderListClientProps {
  initialProviders: Provider[];
}

interface FilterState {
  search?: string;
  isActive?: boolean | 'all';
  sortBy?: 'name' | 'email' | 'phone';
  sortOrder?: 'asc' | 'desc';
}

export function ProviderListClient({ initialProviders }: ProviderListClientProps) {
  const router = useRouter();
  const [actionLoading, setActionLoading] = useState(false);
  const [logRefreshKey, setLogRefreshKey] = useState(0);
  const [filters, setFilters] = useState<FilterState>({
    isActive: 'all',
  });

  // ✅ Client-side filtriranje i sortiranje
  const filteredProviders = useMemo(() => {
    let result = [...initialProviders];

    // Filter po isActive statusu
    if (filters.isActive !== 'all' && filters.isActive !== undefined) {
      result = result.filter(provider => provider.isActive === filters.isActive);
    }

    // Pretraga po imenu, kontakt imenu, email-u ili telefonu
    if (filters.search && filters.search.trim()) {
      const searchLower = filters.search.toLowerCase().trim();
      result = result.filter(provider =>
        provider.name.toLowerCase().includes(searchLower) ||
        provider.contactName?.toLowerCase().includes(searchLower) ||
        provider.email?.toLowerCase().includes(searchLower) ||
        provider.phone?.toLowerCase().includes(searchLower)
      );
    }

    // Sortiranje
    if (filters.sortBy) {
      result.sort((a, b) => {
        const aValue = a[filters.sortBy!] || '';
        const bValue = b[filters.sortBy!] || '';
        const comparison = aValue.toString().localeCompare(bValue.toString());
        return filters.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    return result;
  }, [initialProviders, filters]);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleStatusChange = async (id: string, isActive: boolean) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/providers/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update status');
      }

      toast.success(`Provider ${isActive ? 'activated' : 'deactivated'} successfully`);
      router.refresh();
      setLogRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('[STATUS_CHANGE_ERROR]', error);
      toast.error(error instanceof Error ? error.message : "Failed to update provider status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRenewContract = async (id: string) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/providers/${id}/renew-contract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to renew contract');
      }

      toast.success("Contract renewed successfully");
      router.refresh();
      setLogRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('[RENEW_CONTRACT_ERROR]', error);
      toast.error(error instanceof Error ? error.message : "Failed to renew contract");
    } finally {
      setActionLoading(false);
    }
  };

  const triggerLogRefresh = () => {
    setLogRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-4">
      <ProviderFilters
        initialFilters={filters}
        onFilterChange={handleFilterChange}
        loading={actionLoading}
      />

      {/* Provider count indicator */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>
          Showing {filteredProviders.length} of {initialProviders.length} providers
          {filters.isActive !== 'all' && ` (${filters.isActive ? 'Active' : 'Inactive'} only)`}
        </span>
      </div>

      {filteredProviders.length === 0 ? (
        <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">
            {filters.search 
              ? `No providers found matching "${filters.search}"`
              : "No providers found."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProviders.map(provider => (
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

      {/* Activity Log Section */}
      <div className="mt-8">
        <ProviderLogList logRefreshKey={logRefreshKey} />
      </div>
    </div>
  );
}