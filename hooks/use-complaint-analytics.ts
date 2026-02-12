// hooks/use-complaint-analytics.ts

'use client';

import { useState, useEffect, useCallback } from 'react';
import { ComplaintStatus } from '@prisma/client';

export interface ComplaintStatsData {
  totalComplaints: number;
  openComplaints: number;
  resolvedComplaints: number;
  averageResolutionTime: number;
  complaintsByStatus: {
    status: string;
    count: number;
  }[];
  complaintsByType: {
    type: string;
    count: number;
  }[];
  complaintsOverTime: {
    date: string;
    count: number;
  }[];
}

export interface DataFilterOptions {
  startDate?: Date;
  endDate?: Date;
  statuses?: ComplaintStatus[];
  providerId?: string;
}

export function useComplaintAnalytics(filters?: DataFilterOptions) {
  const [data, setData] = useState<ComplaintStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      
      if (filters?.startDate) {
        params.append('startDate', filters.startDate.toISOString());
      }
      if (filters?.endDate) {
        params.append('endDate', filters.endDate.toISOString());
      }
      if (filters?.statuses) {
        params.append('statuses', filters.statuses.join(','));
      }
      if (filters?.providerId) {
        params.append('providerId', filters.providerId);
      }

      const response = await fetch(`/api/analytics/complaints?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch complaint analytics');
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchAnalytics,
  };
}