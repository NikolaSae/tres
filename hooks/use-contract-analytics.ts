// hooks/use-contract-analytics.ts

'use client';

import { useState, useEffect, useCallback } from 'react';

export interface ContractAnalytics {
  totalContracts: number;
  activeContracts: number;
  expiredContracts: number;
  pendingContracts: number;
  expiringContracts: number;
  contractsByType: {
    type: string;
    count: number;
  }[];
  contractsByStatus: {
    status: string;
    count: number;
  }[];
  revenueByMonth: {
    month: string;
    revenue: number;
  }[];
  upcomingExpirations: {
    id: string;
    name: string;
    contractNumber: string;
    endDate: string;
    daysUntilExpiration: number;
  }[];
}

export function useContractAnalytics(dateRange?: { from: Date; to: Date }) {
  const [analytics, setAnalytics] = useState<ContractAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      
      if (dateRange?.from) {
        params.append('startDate', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        params.append('endDate', dateRange.to.toISOString());
      }

      const response = await fetch(`/api/analytics/contracts?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch contract analytics');
      }
      
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    isLoading,
    error,
    refetch: fetchAnalytics,
  };
}

// Additional hook for contract trends
export function useContractTrends(period: 'week' | 'month' | 'quarter' | 'year' = 'month') {
  const [trends, setTrends] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/analytics/contracts/trends?period=${period}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch contract trends');
        }
        
        const data = await response.json();
        setTrends(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrends();
  }, [period]);

  return {
    trends,
    isLoading,
    error,
  };
}

// Hook for contract performance metrics
export function useContractPerformance() {
  const [performance, setPerformance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/analytics/contracts/performance');
        
        if (!response.ok) {
          throw new Error('Failed to fetch contract performance');
        }
        
        const data = await response.json();
        setPerformance(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchPerformance();
  }, []);

  return {
    performance,
    isLoading,
    error,
  };
}