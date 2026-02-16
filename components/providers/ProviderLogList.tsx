// components/providers/ProviderLogList.tsx
"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Loader2, CheckCircle2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { LogActionType, LogStatus } from "@prisma/client";
import { useProviderLogs } from "@/hooks/use-provider-logs";
import { LogFilters } from "@/components/logs/LogFilters";
import Link from "next/link";
import { toast } from "sonner";
import { updateLogStatus } from "@/actions/log/updateLogStatus";
import { LogEntryItem, LogFiltersState } from "@/lib/types/log-types";

type SortField = 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'action' | 'subject' | 'description' | 'status' | 'sendEmail' | 'provider';
type SortDirection = 'asc' | 'desc' | null;

interface SortConfig {
  field: SortField | null;
  direction: SortDirection;
}

interface ProviderLogListProps {
  logRefreshKey: number;
}

export default function ProviderLogList({ logRefreshKey }: ProviderLogListProps) {
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [filters, setFilters] = useState<LogFiltersState>({});
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'createdAt', direction: 'desc' });

  const { logs, total, loading, error, refreshData } = useProviderLogs({ 
    filters, 
    pagination, 
    logRefreshKey 
  });

  // ✅ Memoized callback za page change
  const handlePageChange = useCallback((newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  }, []);

  // ✅ Memoized callback za filter change
  const handleFilterChange = useCallback((newFilters: LogFiltersState) => {
    setPagination(prev => ({ ...prev, page: 1 }));
    setFilters(newFilters);
  }, []);

  // ✅ Memoized callback za sort
  const handleSort = useCallback((field: SortField) => {
    setSortConfig(prev => {
      if (prev.field === field) {
        if (prev.direction === 'asc') {
          return { field, direction: 'desc' };
        } else if (prev.direction === 'desc') {
          return { field: null, direction: null };
        } else {
          return { field, direction: 'asc' };
        }
      } else {
        return { field, direction: 'asc' };
      }
    });
  }, []);

  // ✅ Memoized sort icon component
  const getSortIcon = useCallback((field: SortField) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    
    if (sortConfig.direction === 'asc') {
      return <ArrowUp className="h-4 w-4 text-purple-600" />;
    } else if (sortConfig.direction === 'desc') {
      return <ArrowDown className="h-4 w-4 text-purple-600" />;
    }
    
    return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
  }, [sortConfig]);

  // ✅ Memoized sorted logs sa optimizovanim sortiranjem
  const sortedLogs = useMemo(() => {
    if (!logs || !sortConfig.field || !sortConfig.direction) {
      return logs || [];
    }

    const statusPriority: Record<LogStatus, number> = {
      'IN_PROGRESS': 1,
      'FINISHED': 2,
    };

    return [...logs].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.field) {
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        case 'createdBy':
          aValue = (a.createdBy?.name || '').toLowerCase();
          bValue = (b.createdBy?.name || '').toLowerCase();
          break;
        case 'updatedBy':
          aValue = (a.updatedBy?.name || '').toLowerCase();
          bValue = (b.updatedBy?.name || '').toLowerCase();
          break;
        case 'action':
          aValue = a.action;
          bValue = b.action;
          break;
        case 'subject':
          aValue = a.subject.toLowerCase();
          bValue = b.subject.toLowerCase();
          break;
        case 'description':
          aValue = (a.description || '').toLowerCase();
          bValue = (b.description || '').toLowerCase();
          break;
        case 'status':
          aValue = statusPriority[a.status] ?? 3;
          bValue = statusPriority[b.status] ?? 3;
          break;
        case 'sendEmail':
          aValue = a.sendEmail ? 1 : 0;
          bValue = b.sendEmail ? 1 : 0;
          break;
        case 'provider':
          aValue = (a.provider?.name || '').toLowerCase();
          bValue = (b.provider?.name || '').toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [logs, sortConfig]);

  // ✅ Memoized status badge
  const getStatusBadge = useCallback((status: LogStatus) => {
    switch (status) {
      case "IN_PROGRESS":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">In Progress</Badge>;
      case "FINISHED":
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Finished</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }, []);

  // ✅ Memoized action display
  const getActionDisplay = useCallback((action: LogActionType) => {
    const actionConfig: Record<LogActionType, { label: string; color: string }> = {
      'ACTIVATION': { label: 'Activation', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
      'DEACTIVATION': { label: 'Deactivation', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
      'STATUS_CHANGE': { label: 'Status Change', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
      'NOTE': { label: 'Note', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
    };

    const config = actionConfig[action] || { label: action, color: '' };
    return <Badge variant="outline" className={config.color}>{config.label}</Badge>;
  }, []);

  // ✅ Optimizovana funkcija za update statusa
  const handleUpdateLogStatus = useCallback(async (logId: string, newStatus: LogStatus) => {
    setUpdatingStatus(logId);
    try {
      const result = await updateLogStatus({ id: logId, status: newStatus });

      if (result.success) {
        toast.success("Log status updated successfully");
        refreshData();
      } else {
        toast.error(result.error || "Failed to update log status");
      }
    } catch (error) {
      console.error("[UPDATE_LOG_STATUS_ERROR]", error);
      toast.error("An unexpected error occurred while updating log status");
    } finally {
      setUpdatingStatus(null);
    }
  }, [refreshData]);

  // ✅ Memoized SortableHeader component
  const SortableHeader = useCallback(({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead>
      <Button
        variant="ghost"
        className="h-auto p-0 font-semibold text-left justify-start hover:bg-transparent"
        onClick={() => handleSort(field)}
      >
        <span className="flex items-center gap-2">
          {children}
          {getSortIcon(field)}
        </span>
      </Button>
    </TableHead>
  ), [handleSort, getSortIcon]);

  // ✅ Memoized total pages calculation
  const totalPages = useMemo(() => Math.ceil(total / pagination.limit), [total, pagination.limit]);

  if (loading && !logs) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Provider Log Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="text-lg flex items-center gap-2">
          Provider Log Entries
          {loading && <Loader2 className="h-4 w-4 animate-spin text-purple-600" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <LogFilters onFilterChange={handleFilterChange} initialFilters={filters} />

        {error && (
          <div className="text-center py-4 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        {!loading && !error && (!logs || logs.length === 0) ? (
          <EmptyState
            title="No Log Entries Found"
            description="No log entries available for providers matching your criteria."
          />
        ) : (
          <>
            {/* Results count */}
            {logs && logs.length > 0 && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, total)} of {total} log entries
              </div>
            )}

            <div className="rounded-md border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableHeader field="createdAt">Timestamp</SortableHeader>
                      <SortableHeader field="updatedAt">Updated At</SortableHeader>
                      <SortableHeader field="createdBy">Created By</SortableHeader>
                      <SortableHeader field="updatedBy">Updated By</SortableHeader>
                      <SortableHeader field="action">Action</SortableHeader>
                      <SortableHeader field="subject">Subject</SortableHeader>
                      <SortableHeader field="description">Description</SortableHeader>
                      <SortableHeader field="status">Status</SortableHeader>
                      <SortableHeader field="sendEmail">Email Sent</SortableHeader>
                      <SortableHeader field="provider">Provider</SortableHeader>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedLogs.map(log => (
                      <TableRow key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <TableCell className="whitespace-nowrap">{format(new Date(log.createdAt), "PPP p")}</TableCell>
                        <TableCell className="whitespace-nowrap">{format(new Date(log.updatedAt), "PPP p")}</TableCell>
                        <TableCell>{log.createdBy?.name || 'Unknown User'}</TableCell>
                        <TableCell>{log.updatedBy?.name || '-'}</TableCell>
                        <TableCell>{getActionDisplay(log.action)}</TableCell>
                        <TableCell className="font-medium max-w-xs truncate" title={log.subject}>{log.subject}</TableCell>
                        <TableCell className="max-w-xs truncate" title={log.description || '-'}>{log.description || '-'}</TableCell>
                        <TableCell>{getStatusBadge(log.status)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={log.sendEmail ? 'bg-green-50 text-green-700' : ''}>
                            {log.sendEmail ? 'Yes' : 'No'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.provider ? (
                            <Link 
                              href={`/providers/${log.provider.id}`} 
                              className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 hover:underline font-medium"
                            >
                              {log.provider.name}
                            </Link>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {log.status === LogStatus.IN_PROGRESS && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateLogStatus(log.id, LogStatus.FINISHED)}
                              disabled={updatingStatus === log.id}
                              className="hover:bg-green-50 hover:text-green-700 hover:border-green-300"
                            >
                              {updatingStatus === log.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                  <span>Updating...</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  <span>Mark as Finished</span>
                                </>
                              )}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}

        {/* Pagination */}
        {total > pagination.limit && totalPages > 1 && (
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => {
                    if (pagination.page > 1 && !loading && !updatingStatus) {
                      handlePageChange(pagination.page - 1);
                    }
                  }}
                  className={pagination.page === 1 || loading || !!updatingStatus ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {/* Show max 5 page numbers with ellipsis */}
              {Array.from({ length: Math.min(5, totalPages) }).map((_, index) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = index + 1;
                } else if (pagination.page <= 3) {
                  pageNum = index + 1;
                } else if (pagination.page >= totalPages - 2) {
                  pageNum = totalPages - 4 + index;
                } else {
                  pageNum = pagination.page - 2 + index;
                }

                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => {
                        if (!loading && !updatingStatus) {
                          handlePageChange(pageNum);
                        }
                      }}
                      isActive={pageNum === pagination.page}
                      className={loading || !!updatingStatus ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              <PaginationItem>
                <PaginationNext
                  onClick={() => {
                    if (pagination.page < totalPages && !loading && !updatingStatus) {
                      handlePageChange(pagination.page + 1);
                    }
                  }}
                  className={pagination.page >= totalPages || loading || !!updatingStatus ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </CardContent>
    </Card>
  );
}