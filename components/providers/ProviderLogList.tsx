//components/providers/ProviderLogList.tsx

"use client";

import React, { useState } from 'react';
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

type SortField = 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'action' | 'subject' | 'description' | 'status' | 'sendEmail' | 'provider';
type SortDirection = 'asc' | 'desc' | null;

interface SortConfig {
  field: SortField | null;
  direction: SortDirection;
}

interface LogEntryItem {
  id: string;
  action: LogActionType;
  subject: string;
  description?: string | null;
  status: LogStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy: {
    id: string;
    name?: string | null;
  };
  updatedBy?: {
      id: string;
      name?: string | null;
  } | null;
  sendEmail: boolean;
  provider: {
      id: string;
      name: string;
  } | null;
}

interface LogFiltersState {
    action?: LogActionType | 'ALL';
    status?: LogStatus | 'ALL';
    subjectKeyword?: string;
    dateFrom?: Date;
    dateTo?: Date;
}

interface ProviderLogListProps {
    logRefreshKey: number;
}

export default function ProviderLogList({ logRefreshKey }: ProviderLogListProps) {
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [filters, setFilters] = useState<LogFiltersState>({});
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: null, direction: null });

  const { logs, total, loading, error, refreshData } = useProviderLogs({ filters, pagination, logRefreshKey });

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleFilterChange = (newFilters: LogFiltersState) => {
    setPagination(prev => ({ ...prev, page: 1 }));
    setFilters(newFilters);
  };

  const handleSort = (field: SortField) => {
    setSortConfig(prev => {
      if (prev.field === field) {
        // Cycle through: asc -> desc -> null
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
  };

  const getSortIcon = (field: SortField) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    
    if (sortConfig.direction === 'asc') {
      return <ArrowUp className="h-4 w-4" />;
    } else if (sortConfig.direction === 'desc') {
      return <ArrowDown className="h-4 w-4" />;
    }
    
    return <ArrowUpDown className="h-4 w-4" />;
  };

  const sortedLogs = React.useMemo(() => {
    if (!logs || !sortConfig.field || !sortConfig.direction) {
      return logs || [];
    }

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
          // Sort by status priority: IN_PROGRESS -> FINISHED
          const getStatusPriority = (status: LogStatus) => {
            switch (status) {
              case 'IN_PROGRESS': return 1;
              case 'FINISHED': return 2;
              default: return 3;
            }
          };
          aValue = getStatusPriority(a.status);
          bValue = getStatusPriority(b.status);
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

   const getStatusBadge = (status: LogStatus) => {
     switch (status) {
       case "IN_PROGRESS":
         return <Badge variant="secondary">In Progress</Badge>;
       case "FINISHED":
         return <Badge variant="success">Finished</Badge>;
       default:
         return <Badge variant="outline">{status}</Badge>;
     }
   };

   const getActionDisplay = (action: LogActionType) => {
        switch(action) {
            case 'ACTIVATION': return <Badge variant="outline">Activation</Badge>;
            case 'DEACTIVATION': return <Badge variant="outline">Deactivation</Badge>;
            case 'STATUS_CHANGE': return <Badge variant="outline">Status Change</Badge>;
            case 'NOTE': return <Badge variant="outline">Note</Badge>;
            default: return action;
        }
   }

    const handleUpdateLogStatus = async (logId: string, newStatus: LogStatus) => {
        setUpdatingStatus(logId);
        try {
            const result = await updateLogStatus({ id: logId, status: newStatus });

            if (result.success) {
                toast.success("Log status updated successfully.");
                refreshData();
            } else {
                toast.error(result.error || "Failed to update log status.");
            }
        } catch (error) {
            console.error("Error updating log status:", error);
            toast.error("An unexpected error occurred while updating log status.");
        } finally {
            setUpdatingStatus(null);
        }
    };

    const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
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
    );

   if (loading) {
     return (
       <div className="flex justify-center items-center py-10">
         <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
       </div>
     );
   }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Provider Log Entries</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <LogFilters onFilterChange={handleFilterChange} initialFilters={filters} />

        {error && (
          <div className="text-center py-4 text-red-500">{error}</div>
        )}

        {!loading && !error && (!logs || logs.length === 0) ? (
          <EmptyState
            title="No Log Entries Found"
            description="No log entries available for providers matching your criteria."
          />
        ) : (
           <div className="rounded-md border">
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
                    <TableRow key={log.id}>
                      <TableCell>{format(new Date(log.createdAt), "PPP p")}</TableCell>
                      <TableCell>{format(new Date(log.updatedAt), "PPP p")}</TableCell>
                      <TableCell>{log.createdBy?.name || 'Unknown User'}</TableCell>
                      <TableCell>{log.updatedBy?.name || '-'}</TableCell>
                      <TableCell>{getActionDisplay(log.action)}</TableCell>
                      <TableCell className="font-medium">{log.subject}</TableCell>
                      <TableCell>{log.description || '-'}</TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell>{log.sendEmail ? 'Yes' : 'No'}</TableCell>
                      <TableCell>
                          {log.provider ? (
                              <Link href={`/providers/${log.provider.id}`} className="text-blue-600 hover:underline">
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
                               >
                                   {updatingStatus === log.id ? (
                                       <Loader2 className="h-4 w-4 animate-spin" />
                                   ) : (
                                       <CheckCircle2 className="h-4 w-4" />
                                   )}
                                    <span className="ml-1">Mark as Finished</span>
                               </Button>
                           )}
                       </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
           </div>
        )}

         {total > pagination.limit && (
            <Pagination className="mt-4">
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious
                            onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                            disabled={pagination.page === 1 || loading || !!updatingStatus}
                        />
                    </PaginationItem>
                    {Array.from({ length: Math.ceil(total / pagination.limit) }).map((_, index) => (
                        <PaginationItem key={index}>
                            <PaginationLink
                                onClick={() => handlePageChange(index + 1)}
                                isActive={index + 1 === pagination.page}
                                disabled={loading || !!updatingStatus}
                            >
                                {index + 1}
                            </PaginationLink>
                        </PaginationItem>
                    ))}
                    <PaginationItem>
                        <PaginationNext
                            onClick={() => handlePageChange(Math.min(Math.ceil(total / pagination.limit), pagination.page + 1))}
                            disabled={pagination.page >= Math.ceil(total / pagination.limit) || loading || !!updatingStatus}
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
         )}

      </CardContent>
    </Card>
  );
}