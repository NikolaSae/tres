// hooks/use-performance-metrics.ts
"use client";

import { useState, useEffect, useCallback } from "react";

// Definisanje očekivane strukture podataka iz API-ja
interface PerformanceDataPoint {
  timestamp: string; // Vreme kao string (može se konvertovati u Date po potrebi)
  responseTime: number; // Vreme odgovora API-ja u ms
  requestCount: number; // Broj zahteva
  errorRate: number; // Stopa grešaka (verovatno decimalna vrednost 0-1 ili procenat)
  cpuUsage: number | null; // Korišćenje CPU-a (npr. procenat)
  memoryUsage: number | null; // Korišćenje memorije (npr. u MB ili GB)
}

// Definisanje dostupnih vremenskih opsega
export type TimeRange = "1h" | "6h" | "24h" | "7d" | "30d" | "all";

interface UsePerformanceMetricsResult {
  data: PerformanceDataPoint[] | null; // Dohvaćeni podaci
  isLoading: boolean; // Stanje učitavanja
  error: string | null; // Poruka o grešci
  refresh: () => void; // Funkcija za ručno osvežavanje podataka
}

// Hook za dohvatanje metrika performansi
export function usePerformanceMetrics(timeRange: TimeRange = "24h"): UsePerformanceMetricsResult {
  const [data, setData] = useState<PerformanceDataPoint[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // State za ručno osvežavanje

  // useCallback memoizes the fetch function
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Dohvatanje podataka sa API rute
      const response = await fetch(`/api/security/performance?timeRange=${timeRange}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch performance data: ${response.statusText}`);
      }

      const fetchedData: PerformanceDataPoint[] = await response.json();
      setData(fetchedData);
    } catch (err) {
      console.error("Error fetching performance metrics:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred while fetching performance data.");
      setData(null); // Clear data on error
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, refreshTrigger]); // Dependency array: re-create fetch function if timeRange or refreshTrigger changes

  // Effect to fetch data when the hook is used or timeRange/refreshTrigger changes
  useEffect(() => {
    fetchData();
  }, [fetchData]); // Dependency array: re-run effect if fetchData changes

  // Funkcija za ručno osvežavanje
  const refresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return {
    data,
    isLoading,
    error,
    refresh,
  };
}
