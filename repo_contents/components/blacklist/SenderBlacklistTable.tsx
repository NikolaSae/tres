// components/blacklist/SenderBlacklistTable.tsx

"use client";

import React from 'react';
import { format } from "date-fns";
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
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Loader2, Eye, EyeOff, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { SenderBlacklistEntry } from "@/lib/types/blacklist";
import { updateBlacklistEntry } from "@/actions/blacklist/update-blacklist-entry";
import { deleteBlacklistEntry } from "@/actions/blacklist/delete-blacklist-entry";
import { BlacklistPagination } from "@/hooks/use-sender-blacklist";
import EmptyState from "@/components/EmptyState";

type SortField = 'senderName' | 'effectiveDate' | 'status' | 'lastMatchDate' | 'description' | 'createdBy' | 'createdAt';
type SortDirection = 'asc' | 'desc' | null;

interface SortConfig {
  field: SortField | null;
  direction: SortDirection;
}

interface SenderBlacklistTableProps {
  entries: SenderBlacklistEntry[];
  isLoading: boolean;
  pagination: BlacklistPagination;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  matchedProviders: Record<string, string[]>; // { [senderName]: providerNames[] }
}

export function SenderBlacklistTable({ 
  entries,
  isLoading,
  pagination,
  onPageChange,
  onRefresh,
  matchedProviders = {}
}: SenderBlacklistTableProps) {
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const [sortConfig, setSortConfig] = React.useState<SortConfig>({ field: null, direction: null });

  const safeEntries = entries || [];

  const handlePageChange = (newPage: number) => {
    onPageChange(newPage);
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

  const sortedEntries = React.useMemo(() => {
    if (!sortConfig.field || !sortConfig.direction) {
      return safeEntries;
    }

    return [...safeEntries].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.field) {
        case 'senderName':
          aValue = a.senderName?.toLowerCase() || '';
          bValue = b.senderName?.toLowerCase() || '';
          break;
        case 'effectiveDate':
          aValue = a.effectiveDate ? new Date(a.effectiveDate).getTime() : 0;
          bValue = b.effectiveDate ? new Date(b.effectiveDate).getTime() : 0;
          break;
        case 'status':
          // Sort by: Active (no matches) -> Detected (has matches) -> Inactive
          const getStatusPriority = (entry: SenderBlacklistEntry) => {
            if (!entry.isActive) return 3; // Inactive
            const hasMatch = matchedProviders[entry.senderName] && matchedProviders[entry.senderName].length > 0;
            return hasMatch ? 2 : 1; // Detected : Active
          };
          aValue = getStatusPriority(a);
          bValue = getStatusPriority(b);
          break;
        case 'lastMatchDate':
          aValue = a.lastMatchDate ? new Date(a.lastMatchDate).getTime() : 0;
          bValue = b.lastMatchDate ? new Date(b.lastMatchDate).getTime() : 0;
          break;
        case 'description':
          aValue = (a.description || '').toLowerCase();
          bValue = (b.description || '').toLowerCase();
          break;
        case 'createdBy':
          aValue = (a.createdBy?.name || '').toLowerCase();
          bValue = (b.createdBy?.name || '').toLowerCase();
          break;
        case 'createdAt':
          aValue = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          bValue = b.createdAt ? new Date(b.createdAt).getTime() : 0;
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
  }, [safeEntries, sortConfig, matchedProviders]);

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    setUpdatingId(id);
    try {
      const result = await updateBlacklistEntry({
        id,
        isActive: !currentStatus
      });

      if (result.success) {
        toast.success(`Blacklist entry ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        onRefresh();
      } else {
        toast.error(result.error || "Failed to update blacklist entry");
      }
    } catch (error) {
      console.error("Error updating blacklist entry:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blacklist entry?")) {
      return;
    }

    setUpdatingId(id);
    try {
      const result = await deleteBlacklistEntry(id);

      if (result.success) {
        toast.success("Blacklist entry deleted successfully");
        onRefresh();
      } else {
        toast.error(result.error || "Failed to delete blacklist entry");
      }
    } catch (error) {
      console.error("Error deleting blacklist entry:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (entry: SenderBlacklistEntry) => {
    if (!entry.isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    
    const hasMatch = matchedProviders[entry.senderName] && matchedProviders[entry.senderName].length > 0;
    
    if (hasMatch) {
      return <Badge variant="destructive">Detected</Badge>;
    }
    
    return <Badge variant="outline">Active</Badge>;
  };

  const renderMatchedProviders = (senderName: string) => {
    if (!matchedProviders[senderName] || matchedProviders[senderName].length === 0) {
      return '-';
    }
    
    return (
      <div className="flex flex-col gap-1 max-w-xs">
        {matchedProviders[senderName].map((provider, index) => (
          <Badge 
            key={index} 
            variant="destructive" 
            className="w-fit truncate"
            title={provider}
          >
            {provider}
          </Badge>
        ))}
      </div>
    );
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

  if (isLoading && safeEntries.length === 0) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalPages = pagination.totalPages || 0;

  return (
    <div className="space-y-4">
      {!isLoading && safeEntries.length === 0 ? (
        <EmptyState
          title="No Blacklist Entries Found"
          description="No sender names are currently blacklisted for the selected criteria."
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader field="senderName">Sender Name</SortableHeader>
                <TableHead className="min-w-[150px]">Matched Providers</TableHead>
                <SortableHeader field="effectiveDate">Effective Date</SortableHeader>
                <SortableHeader field="status">Status</SortableHeader>
                <SortableHeader field="lastMatchDate">Last Match</SortableHeader>
                <SortableHeader field="description">Description</SortableHeader>
                <SortableHeader field="createdBy">Created By</SortableHeader>
                <SortableHeader field="createdAt">Created At</SortableHeader>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedEntries.map(entry => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.senderName}</TableCell>
                  <TableCell>
                    {renderMatchedProviders(entry.senderName)}
                  </TableCell>
                  <TableCell>
                    {entry.effectiveDate 
                      ? format(new Date(entry.effectiveDate), "PPP")
                      : '-'
                    }
                  </TableCell>
                  <TableCell>{getStatusBadge(entry)}</TableCell>
                  <TableCell>
                    {entry.lastMatchDate 
                      ? format(new Date(entry.lastMatchDate), "PPP p")
                      : '-'
                    }
                  </TableCell>
                  <TableCell>{entry.description || '-'}</TableCell>
                  <TableCell>{entry.createdBy?.name || 'Unknown User'}</TableCell>
                  <TableCell>
                    {entry.createdAt 
                      ? format(new Date(entry.createdAt), "PPP")
                      : '-'
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(entry.id, entry.isActive)}
                        disabled={updatingId === entry.id}
                      >
                        {updatingId === entry.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : entry.isActive ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(entry.id)}
                        disabled={updatingId === entry.id}
                      >
                        {updatingId === entry.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                disabled={pagination.page === 1 || isLoading || !!updatingId}
              />
            </PaginationItem>
            {Array.from({ length: Math.min(5, totalPages) }).map((_, index) => {
              const pageNum = index + 1;
              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={() => handlePageChange(pageNum)}
                    isActive={pageNum === pagination.page}
                    disabled={isLoading || !!updatingId}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChange(Math.min(totalPages, pagination.page + 1))}
                disabled={pagination.page >= totalPages || isLoading || !!updatingId}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}