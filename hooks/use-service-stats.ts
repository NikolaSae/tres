// /hooks/use-service-stats.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
// Uvozimo funkcije za statistiku iz lib foldera (nadamo se da su usklađene sa schema.prisma)
import { getServiceRevenueSummary, getProductComplaintStats } from '@/lib/services/statistics'; // Funkcije koje treba da budu usklađene
// Uvozimo tipove ako su potrebni (npr. za strukturu statistika)
// import { ServiceStatistics, RevenueSummary, ComplaintCostSummary } from '@/lib/services/statistics'; // Ako su tamo definisani tipovi rezultata

// Definišite tipove za statističke podatke koje ovaj hook treba da vrati
// Usklađeno sa onim što getServiceRevenueSummary i getProductComplaintStats vraćaju i vašom šemom
interface RevenueSummary {
    id: string;
    name: string;
    totalRevenue: number;
    contractsCount: number;
}

interface ComplaintCostSummary {
    id: string;
    name: string;
    averageCost: number;
    totalComplaints: number;
}

interface ServiceStatistics {
    revenueSummary?: RevenueSummary[];
    complaintStats?: ComplaintCostSummary[];
    // Dodajte druge statističke podatke po potrebi
}

interface UseServiceStatsResult {
    stats: ServiceStatistics | null;
    loading: boolean;
    error: Error | null;
    // refresh: () => void; // Opciono: funkcija za osvežavanje statistike
}

/**
 * Hook za dohvatanje i prikaz statistika vezanih za servise ili proizvode.
 * Koristi funkcije iz lib/services/statistics.ts.
 * Usklađen sa relevantnim modelima u schema.prisma.
 * @param serviceIds - Opcioni niz ID-jeva servisa za koje se računa statistika.
 * @param productIds - Opcioni niz ID-jeva proizvoda za koje se računa statistika.
 * @param dateRange - Opcioni objekat sa from/to datumima za filtriranje statistike.
 * @returns Objekat sa statističkim podacima, statusom učitavanja i greškom.
 */
export function useServiceStats(
    serviceIds?: string[],
    productIds?: string[],
    // dateRange?: { from: Date; to: Date } // Primer opcionalnog parametra
): UseServiceStatsResult {
    const [stats, setStats] = useState<ServiceStatistics | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Efekat za dohvatanje statistika pri montiranju ili promeni zavisnosti
    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            setError(null);

            try {
                const serviceStats: ServiceStatistics = {};

                // Dohvatanje statistika prihoda za servise ako su serviceIds prosleđeni
                if (serviceIds && serviceIds.length > 0) {
                     // Pozivamo funkciju iz lib/services/statistics.ts
                     const revenueSummary = await getServiceRevenueSummary(serviceIds);
                     serviceStats.revenueSummary = revenueSummary;
                }

                // Dohvatanje statistika reklamacija za proizvode ako su productIds prosleđeni
                 if (productIds && productIds.length > 0) {
                      // Pozivamo funkciju iz lib/services/statistics.ts
                      const complaintStats = await getProductComplaintStats(productIds);
                      serviceStats.complaintStats = complaintStats; // Dodajemo complaintStats
                 }

                // Dodajte pozive za druge statistike po potrebi

                setStats(serviceStats);

            } catch (err) {
                console.error("Error fetching service statistics:", err);
                setError(err instanceof Error ? err : new Error('Failed to fetch service statistics.'));
                setStats(null); // Resetuj statistike u slučaju greške
            } finally {
                setLoading(false);
            }
        };

        // Pokrećemo fetch samo ako postoje serviceIds ILI productIds za dohvatanje
        if ((serviceIds && serviceIds.length > 0) || (productIds && productIds.length > 0)) {
             fetchStats();
        } else {
             // Resetujemo stanje ako nema ID-jeva za koje treba dohvatiti statistiku
             setStats(null);
             setLoading(false);
             setError(null);
        }

        // Zavisnosti useEffect-a: ID-jevi servisa/proizvoda i opcionalni filteri datuma
        // Ako dodate dateRange kao parametar, dodajte ga ovde
        // Funkcije getServiceRevenueSummary i getProductComplaintStats NE treba dodavati jer nisu useCallback memoizovane
    }, [serviceIds, productIds /* , dateRange */]);

     // Opciono: Funkcija za ručno osvežavanje
     // const refresh = useCallback(() => {
     //     // Implementirati logiku za ponovno pokretanje useEffect-a
     //     // Npr. ažuriranjem stanja koje je u zavisnostima useEffect-a
     //     // setRefreshCounter(prev => prev + 1); // Potrebno dodati refreshCounter state
     // }, [serviceIds, productIds /* , dateRange */]); // Zavisnosti ručnog osvežavanja


    return {
        stats,
        loading,
        error,
        // refresh,
    };
}