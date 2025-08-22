// /hooks/use-humanitarian-renewals.ts
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  HumanitarianRenewalWithRelations,
  HumanitarianRenewalsList,
  RenewalStatistics,
  RenewalFilters
} from '@/lib/types/humanitarian-renewal-types';
import {
  CreateHumanitarianRenewalInput,
  UpdateHumanitarianRenewalInput
} from '@/schemas/humanitarian-renewal';

interface UseHumanitarianRenewalsOptions {
  initialFilters?: Partial<RenewalFilters>;
  autoFetch?: boolean;
}

export function useHumanitarianRenewals(options: UseHumanitarianRenewalsOptions = {}) {
  const { initialFilters = {}, autoFetch = true } = options;

  const [renewals, setRenewals] = useState<HumanitarianRenewalWithRelations[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState<Partial<RenewalFilters>>(initialFilters);

  const fetchRenewals = useCallback(async (newFilters?: Partial<RenewalFilters>) => {
    try {
      setLoading(true);
      setError(null);
      const searchParams = new URLSearchParams();
      const currentFilters = newFilters || filters;
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.set(key, value.toString());
        }
      });
      const response = await fetch(`/api/humanitarian-renewals?${searchParams}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Greška pri dohvatanju podataka');
      }

      const data: HumanitarianRenewalsList = await response.json();

      setRenewals(data.renewals);
      setPagination({
        page: data.page,
        limit: data.limit,
        total: data.total,
        totalPages: data.totalPages
      });
      if (newFilters) {
        setFilters(newFilters);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Neočekivana greška';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const createRenewal = useCallback(async (data: CreateHumanitarianRenewalInput) => {
    try {
      setLoading(true);

      const response = await fetch('/api/humanitarian-renewals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Greška pri kreiranju obnove');
      }

      const newRenewal: HumanitarianRenewalWithRelations = await response.json();

      setRenewals(prev => [newRenewal, ...prev]);
      toast.success('Obnova je uspešno kreirana');

      return { success: true, data: newRenewal };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Neočekivana greška';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateRenewal = useCallback(async (id: string, data: Omit<UpdateHumanitarianRenewalInput, 'id'>) => {
    try {
      setLoading(true);

      const response = await fetch(`/api/humanitarian-renewals/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Greška pri ažuriranju obnove');
      }

      const updatedRenewal: HumanitarianRenewalWithRelations = await response.json();

      setRenewals(prev =>
        prev.map(renewal =>
          renewal.id === id ? updatedRenewal : renewal
        )
      );

      toast.success('Obnova je uspešno ažurirana');
      return { success: true, data: updatedRenewal };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Neočekivana greška';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteRenewal = useCallback(async (id: string) => {
    try {
      setLoading(true);

      const response = await fetch(`/api/humanitarian-renewals/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Greška pri brisanju obnove');
      }

      setRenewals(prev => prev.filter(renewal => renewal.id !== id));
      toast.success('Obnova je uspešno obrisana');

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Neočekivana greška';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshRenewals = useCallback(() => {
    return fetchRenewals();
  }, [fetchRenewals]);

  const changePage = useCallback((newPage: number) => {
    const newFilters = { ...filters, page: newPage };
    return fetchRenewals(newFilters);
  }, [filters, fetchRenewals]);

  const changeLimit = useCallback((newLimit: number) => {
    const newFilters = { ...filters, limit: newLimit, page: 1 };
    return fetchRenewals(newFilters);
  }, [filters, fetchRenewals]);

  const applyFilters = useCallback((newFilters: Partial<RenewalFilters>) => {
    const filtersWithPage = { ...newFilters, page: 1 };
    return fetchRenewals(filtersWithPage);
  }, [fetchRenewals]);

  const clearFilters = useCallback(() => {
    const clearedFilters = { page: 1, limit: filters.limit || 10 };
    return fetchRenewals(clearedFilters);
  }, [fetchRenewals, filters.limit]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchRenewals();
    }
  }, [autoFetch, fetchRenewals]); // Added fetchRenewals to dependencies

  return {
    renewals,
    loading,
    error,
    pagination,
    filters,
    actions: {
      fetchRenewals,
      createRenewal,
      updateRenewal,
      deleteRenewal,
      refreshRenewals,
      changePage,
      changeLimit,
      applyFilters,
      clearFilters
    }
  };
}

// Hook za statistike
export function useRenewalStatistics() {
  const [statistics, setStatistics] = useState<RenewalStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/humanitarian-renewals/statistics');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Greška pri dohvatanju statistika');
      }

      const data: RenewalStatistics = await response.json();
      setStatistics(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Neočekivana greška';
      setError(errorMessage);
      toast.error(errorMessage); // Prikazuje toast obaveštenje za grešku
    } finally {
      setLoading(false);
    }
  }, []); // Nema zavisnosti jer ne zavisi od spoljnih stanja

  // Auto-fetch on mount
  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return {
    statistics,
    loading,
    error,
    actions: {
      fetchStatistics
    }
  };
}