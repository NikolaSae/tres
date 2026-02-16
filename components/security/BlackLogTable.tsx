// components/security/BlackLogTable.tsx
"use client";

import { BlacklistLog, LogBlackType } from "@prisma/client";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { ChevronDown, ChevronRight, User, Calendar, FileText, AlertCircle } from "lucide-react";
import { useState, Fragment, useMemo } from "react";

interface BlacklistLogWithUser extends BlacklistLog {
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
  blacklistEntry: {
    id: string;
    senderName: string;
  } | null;
}

interface BlackLogTableProps {
  logs: BlacklistLogWithUser[];
  pagination: {
    page: number;
    limit: number;
  };
  total: number;
  onPageChange: (page: number) => void;
}

interface ParsedData {
  senderName?: string;
  isActive?: boolean;
  description?: string;
  effectiveDate?: string;
  matchCount?: number;
  lastMatchDate?: string;
  createdBy?: { name: string };
  modifiedBy?: { name: string };
  [key: string]: any;
}

export function BlackLogTable({ logs, pagination, total, onPageChange }: BlackLogTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (logId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedRows(newExpanded);
  };

  const getActionBadge = (action: LogBlackType) => {
    const config: Record<LogBlackType, { variant: any; label: string; className: string }> = {
      CREATE: { 
        variant: "default", 
        label: "Created", 
        className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
      },
      UPDATE: { 
        variant: "secondary", 
        label: "Updated", 
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" 
      },
      DELETE: { 
        variant: "destructive", 
        label: "Deleted", 
        className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" 
      },
      ACTIVATE: { 
        variant: "default", 
        label: "Activated", 
        className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" 
      },
      DEACTIVATE: { 
        variant: "outline", 
        label: "Deactivated", 
        className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200" 
      }
    };
    
    const config_item = config[action];
    
    return <Badge variant={config_item.variant} className={config_item.className}>{config_item.label}</Badge>;
  };

  const formatDataForDisplay = (data: any): ParsedData => {
    if (!data) return {};
    
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      return {
        senderName: parsed.senderName,
        isActive: parsed.isActive,
        description: parsed.description,
        effectiveDate: parsed.effectiveDate ? format(new Date(parsed.effectiveDate), "PPP") : undefined,
        matchCount: parsed.matchCount,
        lastMatchDate: parsed.lastMatchDate ? format(new Date(parsed.lastMatchDate), "PPP p") : undefined,
        createdBy: parsed.createdBy,
        modifiedBy: parsed.modifiedBy,
      };
    } catch (error) {
      console.error("[FORMAT_DATA_ERROR]", error);
      return {};
    }
  };

  const renderDataComparison = (log: BlacklistLogWithUser) => {
    const oldData = log.oldData ? formatDataForDisplay(log.oldData) : null;
    const newData = log.newData ? formatDataForDisplay(log.newData) : null;

    if (log.action === LogBlackType.CREATE) {
      return (
        <div className="space-y-3">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Created Entry
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {newData?.senderName && (
                <div className="flex flex-col space-y-1">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Sender Name:</span>
                  <span className="text-gray-900 dark:text-gray-100 font-semibold">{newData.senderName}</span>
                </div>
              )}
              {newData?.isActive !== undefined && (
                <div className="flex flex-col space-y-1">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Status:</span>
                  <Badge variant={newData.isActive ? "default" : "outline"} className="w-fit">
                    {newData.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              )}
              {newData?.effectiveDate && (
                <div className="flex flex-col space-y-1">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Effective Date:</span>
                  <span className="text-gray-900 dark:text-gray-100">{newData.effectiveDate}</span>
                </div>
              )}
              {newData?.matchCount !== undefined && (
                <div className="flex flex-col space-y-1">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Match Count:</span>
                  <span className="text-gray-900 dark:text-gray-100">{newData.matchCount}</span>
                </div>
              )}
              {newData?.lastMatchDate && (
                <div className="flex flex-col space-y-1">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Last Match:</span>
                  <span className="text-gray-900 dark:text-gray-100">{newData.lastMatchDate}</span>
                </div>
              )}
              {newData?.description && (
                <div className="md:col-span-2 flex flex-col space-y-1">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Description:</span>
                  <span className="text-gray-900 dark:text-gray-100">{newData.description}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (log.action === LogBlackType.DELETE) {
      return (
        <div className="space-y-3">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Deleted Entry
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {oldData?.senderName && (
                <div className="flex flex-col space-y-1">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Sender Name:</span>
                  <span className="text-gray-900 dark:text-gray-100 font-semibold">{oldData.senderName}</span>
                </div>
              )}
              {oldData?.matchCount !== undefined && (
                <div className="flex flex-col space-y-1">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Total Matches:</span>
                  <span className="text-gray-900 dark:text-gray-100">{oldData.matchCount}</span>
                </div>
              )}
              {oldData?.description && (
                <div className="md:col-span-2 flex flex-col space-y-1">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Description:</span>
                  <span className="text-gray-900 dark:text-gray-100">{oldData.description}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // For UPDATE, ACTIVATE, DEACTIVATE - show comparison
    return (
      <div className="space-y-4">
        {oldData && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-3">Before Changes</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {oldData.isActive !== undefined && (
                <div className="flex flex-col space-y-1">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Status:</span>
                  <Badge variant={oldData.isActive ? "default" : "outline"} className="w-fit">
                    {oldData.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              )}
              {oldData.description !== undefined && (
                <div className="flex flex-col space-y-1">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Description:</span>
                  <span className="text-gray-900 dark:text-gray-100">{oldData.description || "None"}</span>
                </div>
              )}
              {oldData.effectiveDate && (
                <div className="flex flex-col space-y-1">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Effective Date:</span>
                  <span className="text-gray-900 dark:text-gray-100">{oldData.effectiveDate}</span>
                </div>
              )}
              {oldData.matchCount !== undefined && (
                <div className="flex flex-col space-y-1">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Match Count:</span>
                  <span className="text-gray-900 dark:text-gray-100">{oldData.matchCount}</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {newData && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-3">After Changes</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {newData.isActive !== undefined && (
                <div className="flex flex-col space-y-1">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Status:</span>
                  <Badge variant={newData.isActive ? "default" : "outline"} className="w-fit">
                    {newData.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              )}
              {newData.description !== undefined && (
                <div className="flex flex-col space-y-1">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Description:</span>
                  <span className="text-gray-900 dark:text-gray-100">{newData.description || "None"}</span>
                </div>
              )}
              {newData.effectiveDate && (
                <div className="flex flex-col space-y-1">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Effective Date:</span>
                  <span className="text-gray-900 dark:text-gray-100">{newData.effectiveDate}</span>
                </div>
              )}
              {newData.matchCount !== undefined && (
                <div className="flex flex-col space-y-1">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Match Count:</span>
                  <span className="text-gray-900 dark:text-gray-100">{newData.matchCount}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const getSenderName = (log: BlacklistLogWithUser): string => {
    // Try blacklistEntry first (preferred)
    if (log.blacklistEntry?.senderName) {
      return log.blacklistEntry.senderName;
    }
    
    // Fallback to data in log
    const data = log.newData || log.oldData;
    if (!data) return "Unknown";
    
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      return parsed.senderName || "Unknown";
    } catch {
      return "Unknown";
    }
  };

  const totalPages = useMemo(() => Math.ceil(total / pagination.limit), [total, pagination.limit]);

  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Audit Logs</h3>
          <p className="text-gray-500 dark:text-gray-400">No changes have been recorded yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Blacklist Audit Trail
          </CardTitle>
          <CardDescription>
            Detailed history of changes made to sender blacklist entries
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Sender</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      User
                    </div>
                  </TableHead>
                  <TableHead className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Calendar className="h-4 w-4" />
                      Timestamp
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <Fragment key={log.id}>
                    <TableRow 
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      onClick={() => toggleRow(log.id)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleRow(log.id)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                          aria-label={expandedRows.has(log.id) ? "Collapse details" : "Expand details"}
                        >
                          {expandedRows.has(log.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      </TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell className="font-medium">{getSenderName(log)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>{log.user.name || "Unknown User"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                            {format(new Date(log.timestamp), "PPP p")}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedRows.has(log.id) && (
                      <TableRow>
                        <TableCell colSpan={5} className="bg-gray-50 dark:bg-gray-900/50 p-6">
                          {renderDataComparison(log)}
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {total > pagination.limit && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, total)} of {total} logs
          </div>
          
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => {
                    if (pagination.page > 1) {
                      onPageChange(pagination.page - 1);
                    }
                  }}
                  className={pagination.page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>

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
                      onClick={() => onPageChange(pageNum)}
                      isActive={pageNum === pagination.page}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              <PaginationItem>
                <PaginationNext
                  onClick={() => {
                    if (pagination.page < totalPages) {
                      onPageChange(pagination.page + 1);
                    }
                  }}
                  className={pagination.page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}