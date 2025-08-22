///hooks/use-expiring-contracts.ts
"use client";

import { useState, useEffect } from "react";
import { Contract, ContractStatus } from "@prisma/client";

export interface ExpiringContractWithDetails extends Contract {
  provider?: { name: string } | null;
  humanitarianOrg?: { name: string } | null;
  parkingService?: { name: string } | null;
  _count: {
    reminders: number;
  };
}

export interface UseExpiringContractsOptions {
  days?: number;
  refreshInterval?: number;
  status?: ContractStatus;
}

export function useExpiringContracts(options: UseExpiringContractsOptions = {}) {
  const { 
    days = 30,
    refreshInterval = 0
  } = options;
  
  const [contracts, setContracts] = useState<ExpiringContractWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchExpiringContracts = async () => {
    console.log(`Fetching expiring contracts (days=${days})`);
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/contracts/expiring?days=${days}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error: ${response.status} - ${errorText}`);
        throw new Error(`Error fetching expiring contracts: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`Successfully fetched ${data.contracts.length} contracts`);
      setContracts(data.contracts);
      setError(null);
    } catch (err) {
      console.error("Error in fetchExpiringContracts:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log("Initializing useExpiringContracts hook");
    fetchExpiringContracts();
    
    if (refreshInterval > 0) {
      console.log(`Setting up refresh interval (${refreshInterval}ms)`);
      const intervalId = setInterval(fetchExpiringContracts, refreshInterval);
      
      return () => {
        console.log("Cleaning up refresh interval");
        clearInterval(intervalId);
      };
    }
  }, [days, status, refreshInterval]);

  const refresh = () => {
    console.log("Manually refreshing contracts");
    fetchExpiringContracts();
  };

  const groupedByExpiryTimeframe = () => {
    console.log("Grouping contracts by expiry timeframe");
    const now = new Date();
    const sevenDays = new Date();
    sevenDays.setDate(sevenDays.getDate() + 7);
    const fourteenDays = new Date();
    fourteenDays.setDate(fourteenDays.getDate() + 14);
    
    return {
      critical: contracts.filter(c => new Date(c.endDate) <= sevenDays),
      warning: contracts.filter(c => {
        const endDate = new Date(c.endDate);
        return endDate > sevenDays && endDate <= fourteenDays;
      }),
      notice: contracts.filter(c => {
        const endDate = new Date(c.endDate);
        return endDate > fourteenDays;
      })
    };
  };

  console.log(`Current state: isLoading=${isLoading}, error=${error?.message}, contractsCount=${contracts.length}`);

  return {
    contracts,
    isLoading,
    error,
    refresh,
    count: contracts.length,
    groupedByExpiryTimeframe,
  };
}