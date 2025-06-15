// /hooks/use-humanitarian-org-contracts.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
// Uvozimo custom tip za ugovore sa uključenim obnovama (i potencijalno operatorom, itd. kao u API ruti)
// Prilagodite ovaj tip da odgovara strukturi koju vraća vaša API ruta include klauzula
interface ContractWithDetails {
  id: string;
  name: string;
  contractNumber: string;
  status: "ACTIVE" | "EXPIRED" | "PENDING" | "RENEWAL_IN_PROGRESS" | "TERMINATED"; // Dodat TERMINATED status
  startDate: string | Date;
  endDate: string | Date;
  revenuePercentage: number;
  type: "HUMANITARIAN";
  // Dodajte ovde polja koja su uključena u API ruti, npr:
  // humanitarianRenewals: Array<any>; // Ako su uključene obnove
  operator?: { // Ako je uključen operator
     id: string;
     name: string;
  } | null;
}


interface UseHumanitarianOrgContractsResult {
  contracts: ContractWithDetails[]; // Lista ugovora
  isLoading: boolean; // Status učitavanja
  error: string | null; // Poruka o grešci (promenjeno iz Error | null u string | null za lakše rukovanje u UI)
  totalResults: number; // Ukupan broj rezultata (za paginaciju)
  totalPages: number; // Ukupan broj stranica (za paginaciju)
  currentPage: number; // Trenutna stranica (za paginaciju)
 // Ne izlažemo setPagination direktno, već funkciju za promenu stranice
  setPage: (page: number) => void;
  refresh: () => void; // Funkcija za ručno osvežavanje
}

/**
 * Hook za dohvatanje ugovora povezanih sa specifičnom humanitarnom organizacijom, sa paginacijom.
 * Komunicira sa API rutom /api/humanitarian-orgs/[id]/contracts.
 * @param orgId - ID humanitarne organizacije čije ugovore dohvatamo.
 * @param initialPage - Početna stranica za dohvatanje.
 * @param limit - Broj stavki po stranici.
 * @returns Objekat sa listom ugovora, statusom učitavanja, greškom i paginacijskim informacijama.
 */
export function useHumanitarianOrgContracts(orgId: string | undefined | null, initialPage: number = 1, limit: number = 5): UseHumanitarianOrgContractsResult {
    const [contracts, setContracts] = useState<ContractWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true); // Počinje kao true jer očekujemo dohvatanje
    const [error, setError] = useState<string | null>(null);
    const [totalResults, setTotalResults] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [refreshTrigger, setRefreshTrigger] = useState(0); // State za ručno osvežavanje


    // Funkcija za dohvatanje podataka (memoizovana zbog zavisnosti od orgId, currentPage i limit)
    const fetchContracts = useCallback(async (id: string, page: number, limit: number) => {
        setIsLoading(true);
        setError(null);

        try {
            // Pozivanje API rute za dohvatanje ugovora za datu organizaciju sa paginacijom
            const response = await fetch(`/api/humanitarian-orgs/${id}/contracts?page=${page}&limit=${limit}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({})); // Pokušaj parsiranja, uhvati grešku ako nije JSON
                const errorMessage = errorData.error || `Failed to fetch associated contracts: ${response.status}`;
                throw new Error(errorMessage);
            }

            // Očekujemo paginirane podatke: { items: [], total: number, totalPages: number, currentPage: number, limit: number }
            const data = await response.json();

            setContracts(data.items || []);
            setTotalResults(data.total || 0);
            setTotalPages(data.totalPages || 1);
            setCurrentPage(data.currentPage || 1); // Ažurirajte trenutnu stranicu na osnovu odgovora API-ja

        } catch (err) {
            console.error(`Error fetching contracts for organization ${id}:`, err);
            setError(err instanceof Error ? err.message : 'Failed to fetch associated contracts.');
            setContracts([]); // Resetuj listu u slučaju greške
            setTotalResults(0);
            setTotalPages(1);
            setCurrentPage(1);
        } finally {
            setIsLoading(false);
        }
    }, [orgId, currentPage, limit, refreshTrigger]); // Zavisnosti: orgId, currentPage, limit, refreshTrigger

    // Efekat za dohvatanje podataka kada se orgId, currentPage, limit ili refreshTrigger promene
    useEffect(() => {
        // Dohvati podatke samo ako imamo važeći orgId
        if (orgId) {
            fetchContracts(orgId, currentPage, limit);
        } else {
             // Resetuj stanje ako nema orgId
             setContracts([]);
             setIsLoading(false); // Postavite loading na false ako ID nedostaje
             setError("Organization ID is missing."); // Postavite grešku
            setTotalResults(0);
            setTotalPages(1);
            setCurrentPage(1);
        }
    }, [orgId, currentPage, limit, fetchContracts]); // Zavisnosti: orgId, currentPage, limit, fetchContracts

    // Funkcija za promenu stranice
    const setPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    // Funkcija za ručno osvežavanje
    const refresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };


    return {
        contracts, // Izlažemo listu ugovora
        isLoading, // Izlažemo status učitavanja
        error, // Izlažemo grešku
        totalResults, // Izlažemo ukupan broj rezultata
        totalPages, // Izlažemo ukupan broj stranica
        currentPage, // Izlažemo trenutnu stranicu
        setPage, // Izlažemo funkciju za promenu stranice
        refresh, // Izlažemo funkciju za osvežavanje
    };
}
