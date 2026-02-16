// components/audit-logs/BlacklistAuditLogsClient.tsx
"use client";

import { useState, useCallback, useEffect } from "react";
import { BlackLogTable } from "@/components/security/BlackLogTable";
import { AuditLogFilters } from "@/components/audit-logs/AuditLogFilters";
import { getBlacklistLogs } from "@/actions/blacklist/get-blacklist-logs";
import { Loader2 } from "lucide-react";
import { LogBlackType } from "@prisma/client";

interface FilterState {
  search?: string;
  action?: LogBlackType | "all";
  dateFrom?: Date;
  dateTo?: Date;
}

export function BlacklistAuditLogsClient() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({ action: "all" });
  const [pagination, setPagination] = useState({ page: 1, limit: 20 });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getBlacklistLogs({
        filters: {
          search: filters.search,
          action: filters.action === "all" ? undefined : filters.action,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
        },
        pagination,
      });

      if (result.success && result.data) {
        setLogs(result.data.logs);
        setTotal(result.data.total);
      } else {
        setError(result.error || "Failed to fetch logs");
        setLogs([]);
        setTotal(0);
      }
    } catch (err) {
      console.error("[FETCH_LOGS_ERROR]", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 on filter change
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  }, []);

  if (loading && !logs.length) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-6">
        <p className="font-semibold mb-2">Error loading audit logs</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AuditLogFilters
        logType="blacklist"
        initialFilters={filters}
        onFilterChange={handleFilterChange}
        loading={loading}
      />

      <BlackLogTable
        logs={logs}
        pagination={pagination}
        total={total}
        onPageChange={handlePageChange}
      />
    </div>
  );
}