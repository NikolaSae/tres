// /hooks/use-services.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
// Uvozimo ažurirane tipove (ServiceFilterOptions sada koristi 'type')
import { ServiceWithDetails, ServiceFilterOptions, ServicesApiResponse } from '@/lib/types/service-types';
// Uvozimo server akciju za dohvatanje servisa (AŽURIRANU)
import { getServices } from '@/actions/services/get';

interface UseServicesResult {
  services: ServiceWithDetails[];
  totalCount: number;
  loading: boolean;
  error: Error | null;
  filters: ServiceFilterOptions; // Izlažemo trenutne filtere
  pagination: { page: number; limit: number }; // Izlažemo trenutnu paginaciju
   setFilters: (filters: ServiceFilterOptions) => void; // Funkcija za ažuriranje filtera
   setPagination: (pagination: { page: number; limit: number }) => void; // Funkcija za ažuriranje paginacije
   refresh: () => void; // Funkcija za ručno osvežavanje
}

/**
 * Hook za dohvatanje, filtriranje i paginaciju liste servisa/usluga.
 * Komunicira sa Server Akcijom actions/services/get.ts.
 * Usklađen sa Service modelom u schema.prisma i ažuriranim tipovima.
 * @param initialFilters - Početne opcije filtera.
 * @param initialPagination - Početne opcije paginacije.
 * @returns Objekat sa listom servisa, ukupnim brojem, statusom učitavanja, greškom i funkcijama za manipulaciju.
 */
export function useServices(
    initialFilters: ServiceFilterOptions = {},
    initialPagination: { page: number; limit: number } = { page: 1, limit: 10 }
): UseServicesResult {
    const [services, setServices] = useState<ServiceWithDetails[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    // Stanje filtera kojim hook upravlja (koristi ServiceFilterOptions koji sada ima 'type')
    const [filters, setFiltersState] = useState<ServiceFilterOptions>(initialFilters);
    // Stanje paginacije kojim hook upravlja
    const [pagination, setPaginationState] = useState(initialPagination);

    // Stanje za pokretanje ručnog osvežavanja
    const [refreshCounter, setRefreshCounter] = useState(0);


    // Efekat za dohvatanje podataka pri montiranju ili promeni zavisnosti
    useEffect(() => {
        const fetchServices = async () => {
            setLoading(true);
            setError(null);

            try {
                // Pozivanje AŽURIRANE Server Akcije za dohvatanje servisa
                // Akcija getServices sada očekuje i obrađuje 'type' filter
                const result = await getServices({
                    ...filters, // Prosleđujemo sve filtere (uključujući 'type')
                    page: pagination.page,
                    limit: pagination.limit,
                });

                 if (result.error) {
                      throw new Error(result.error);
                 }

                setServices(result.data || []);
                setTotalCount(result.total || 0);

            } catch (err) {
                console.error("Error fetching services:", err);
                setError(err instanceof Error ? err : new Error('Failed to fetch services.'));
                setServices([]); // Resetuj listu u slučaju greške
                setTotalCount(0);
            } finally {
                setLoading(false);
            }
        };

        fetchServices();

        // Zavisnosti useEffect-a: filteri (koji uključuju 'type'), paginacija i brojač osvežavanja
    }, [filters, pagination, refreshCounter]);


    // Funkcija za promenu filtera
    const setFilters = useCallback((newFilters: ServiceFilterOptions) => {
         // Ažuriramo stanje filtera
         setFiltersState(newFilters);
         // Resetuj na prvu stranicu pri promeni filtera
         setPaginationState(prev => ({ ...prev, page: 1 }));
    }, []);

     // Funkcija za promenu paginacije
     const setPagination = useCallback((newPagination: { page: number; limit: number }) => {
         setPaginationState(newPagination);
     }, []);

     // Funkcija za ručno osvežavanje
     const refresh = useCallback(() => {
         setRefreshCounter(prev => prev + 1); // Menjamo stanje da pokrenemo useEffect
     }, []);


    return {
        services,
        totalCount,
        loading,
        error,
        filters,
        pagination,
        setFilters,
        setPagination,
        refresh,
    };
}