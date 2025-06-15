// /hooks/use-provider-logs.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { LogEntryItem } from "@/components/providers/ProviderLogList";
import { LogEntityType, LogActionType, LogStatus } from "@prisma/client";

import { getLogEntries, GetLogEntriesInput } from "@/actions/log/getLogEntries";

interface PaginationState {
    page: number;
    limit: number;
}

interface LogFiltersState {
    action?: LogActionType | 'ALL';
    status?: LogStatus | 'ALL';
    subjectKeyword?: string;
    dateFrom?: Date;
    dateTo?: Date;
}

interface UseProviderLogsParams {
    filters: LogFiltersState;
    pagination: PaginationState;
    logRefreshKey: number;
}

interface UseProviderLogsResult {
    logs: LogEntryItem[] | null;
    total: number;
    loading: boolean;
    error: string | null;
    refreshData: () => void;
}

export function useProviderLogs({ filters, pagination, logRefreshKey }: UseProviderLogsParams): UseProviderLogsResult {
  const [logs, setLogs] = useState<LogEntryItem[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    console.log(`[useProviderLogs] Fetching logs. Refresh key: ${logRefreshKey}`); // DEBUG LOG
    setLoading(true);
    setError(null);
    try {
      const params: GetLogEntriesInput = {
          entityType: LogEntityType.PROVIDER,
          action: filters.action,
          status: filters.status,
          subjectKeyword: filters.subjectKeyword,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          page: pagination.page,
          limit: pagination.limit,
      };

      const result = await getLogEntries(params);

      if (result.success && result.data) {
             setLogs(result.data.logs as LogEntryItem[]);
             setTotal(result.data.total);
      } else {
        setError(result.error || "Failed to fetch logs.");
        setLogs(null);
        setTotal(0);
      }

    } catch (err) {
      console.error("Error fetching provider logs:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      setLogs(null);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [
      filters.action,
      filters.status,
      filters.subjectKeyword,
      filters.dateFrom?.getTime(),
      filters.dateTo?.getTime(),
      pagination.page,
      pagination.limit,
      logRefreshKey,
  ]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const refreshData = useCallback(() => {
      fetchLogs();
  }, [fetchLogs]);


  return {
    logs,
    total,
    loading,
    error,
    refreshData,
  };
}
