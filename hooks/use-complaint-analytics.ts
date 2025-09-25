// hooks/use-complaint-analytics.ts
import { useState, useEffect, useCallback } from 'react';
import { DataFilterOptions } from '@/components/analytics/DataFilters'; // Assuming this path is correct
import { getComplaintStats } from '@/actions/analytics/get-complaint-stats'; // Assuming this action exists and accepts filters

// Define the type for the complaint data returned by getComplaintStats
// Replace with the actual type definition if you have one
interface ComplaintStatsData {
  totalComplaints: number;
  resolvedComplaints: number;
  openComplaints: number;
  averageResolutionTime: number; // in hours or days
  complaintsByStatus: { status: string; count: number }[];
  complaintsByType: { type: string; count: number }[];
  complaintsOverTime: { date: string; count: number }[]; // e.g., { date: '2023-10-01', count: 15 }
}

interface UseComplaintAnalyticsResult {
  data: ComplaintStatsData | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void; // Optional: Add a refetch function
}

/**
 * Custom hook to fetch and manage complaint analytics data based on provided filters.
 *
 * @param filters - The data filter options (date range, providers, etc.).
 * @param initialData - Optional initial data to use while fetching.
 * @returns An object containing the data, loading state, error, and a refetch function.
 */
export const useComplaintAnalytics = (
  filters: DataFilterOptions,
  initialData: ComplaintStatsData | null = null
): UseComplaintAnalyticsResult => {
  const [data, setData] = useState<ComplaintStatsData | null>(initialData);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastFilters, setLastFilters] = useState<DataFilterOptions>(filters);


  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null); // Clear previous errors

    try {
      // Call the server action or API function to get data
      // Modify getComplaintStats to accept DataFilterOptions if it doesn't already
      const result = await getComplaintStats(filters);
      setData(result);
      setLastFilters(filters); // Update last fetched filters on success
    } catch (err) {
      console.error("Failed to fetch complaint analytics:", err);
      setError(err instanceof Error ? err : new Error('An unexpected error occurred'));
      setData(null); // Clear data on error
    } finally {
      setLoading(false);
    }
  }, [filters]); // Depend on filters so the effect re-runs when filters change

   // Effect to fetch data when filters change
  useEffect(() => {
      // Simple shallow comparison to prevent unnecessary fetches if hook is called
      // with the same filters object reference but no actual changes.
      // For deep comparison of filters, you might need a deep-equal library or custom logic.
      const filtersChanged = JSON.stringify(filters) !== JSON.stringify(lastFilters);

      if (filtersChanged || !data) { // Fetch if filters change or data is initially null
          fetchData();
      }

      // Note: The initialData prop is used to initialize state instantly,
      // the effect will then fetch the data based on the current filters,
      // potentially replacing the initialData if filters are different from the server's initial fetch.

  }, [filters, fetchData, data, lastFilters]);


  // Optional: Refetch function
  const refetch = useCallback(() => {
      fetchData();
  }, [fetchData]);


  return { data, loading, error, refetch };
};