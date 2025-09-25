//hooks/use-parking-service-contracts.ts

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Contract } from "@prisma/client";

/**
 * Custom hook for managing contracts associated with a parking service
 */
export function useParkingServiceContracts(parkingServiceId: string | null) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContracts = async () => {
    if (!parkingServiceId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/parking-services/${parkingServiceId}/contracts`);
      
      if (!response.ok) {
        throw new Error(`Error fetching contracts: ${response.statusText}`);
      }
      
      const data = await response.json();
      setContracts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load contracts");
      toast.error("Failed to load contracts");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [parkingServiceId]);

  return {
    contracts,
    isLoading,
    error,
    refreshContracts: fetchContracts
  };
}