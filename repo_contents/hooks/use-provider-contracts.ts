// /hooks/use-provider-contracts.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { ProviderContractItem } from "@/components/providers/ProviderContracts"; // Import the type from the component

interface UseProviderContractsResult {
  contracts: ProviderContractItem[] | null;
  isLoading: boolean;
  error: string | null;
  refreshContracts: () => Promise<void>;
}

export function useProviderContracts(providerId: string): UseProviderContractsResult {
  const [contracts, setContracts] = useState<ProviderContractItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // useCallback memoizes the fetch function to prevent unnecessary re-creations
  const fetchContracts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // *** IMPORTANT: You need to create this API route handler ***
      // This route should fetch contracts for the given providerId
      const response = await fetch(`/api/providers/${providerId}/contracts`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch contracts: ${response.statusText}`);
      }

      const data: ProviderContractItem[] = await response.json();
      setContracts(data);
    } catch (err) {
      console.error("Error fetching provider contracts:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      setContracts(null); // Clear contracts on error
    } finally {
      setIsLoading(false);
    }
  }, [providerId]); // Dependency array: re-create fetch function if providerId changes

  // Effect to fetch contracts when the hook is used or providerId changes
  useEffect(() => {
    if (providerId) {
      fetchContracts();
    } else {
       // Handle case where providerId might be initially null or undefined
       setContracts(null);
       setIsLoading(false);
       setError("Provider ID is missing.");
    }
  }, [providerId, fetchContracts]); // Dependency array: re-run effect if providerId or fetchContracts changes

  // Expose a function to manually refresh the contracts
  const refreshContracts = useCallback(async () => {
      if (providerId) {
          await fetchContracts();
      }
  }, [providerId, fetchContracts]);

  return {
    contracts,
    isLoading,
    error,
    refreshContracts,
  };
}
