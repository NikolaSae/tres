// Path: components/security/BlackLogTable.tsx

"use client";

import { BlacklistLog, LogBlackType } from "@prisma/client";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, User, Calendar, FileText } from "lucide-react";
import { useState, Fragment } from "react";

interface BlacklistLogWithUser extends BlacklistLog {
  user: {
    id: string;
    name: string | null;
  };
}

interface AuditLogTableProps {
  logs: BlacklistLogWithUser[];
}

interface ParsedData {
  senderName?: string;
  isActive?: boolean;
  description?: string;
  effectiveDate?: string;
  matchCount?: number;
  lastMatchDate?: string;
  createdBy?: { name: string };
  [key: string]: any;
}

export function BlackLogTable({ logs }: AuditLogTableProps) {
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
    const config = {
      CREATE: { variant: "default" as const, label: "Created" },
      UPDATE: { variant: "secondary" as const, label: "Updated" },
      DELETE: { variant: "destructive" as const, label: "Deleted" },
      ACTIVATE: { variant: "default" as const, label: "Activated" },
      DEACTIVATE: { variant: "outline" as const, label: "Deactivated" }
    };
    
    const { variant, label } = config[action] || { variant: "outline" as const, label: action };
    
    return <Badge variant={variant}>{label}</Badge>;
  };

  const formatDataForDisplay = (data: any): ParsedData => {
    if (!data) return {};
    
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    return {
      senderName: parsed.senderName,
      isActive: parsed.isActive,
      description: parsed.description,
      effectiveDate: parsed.effectiveDate ? format(new Date(parsed.effectiveDate), "PPP") : undefined,
      matchCount: parsed.matchCount,
      lastMatchDate: parsed.lastMatchDate ? format(new Date(parsed.lastMatchDate), "PPP p") : undefined,
      createdBy: parsed.createdBy,
    };
  };

  const renderDataComparison = (log: BlacklistLogWithUser) => {
    const oldData = log.oldData ? formatDataForDisplay(log.oldData) : null;
    const newData = log.newData ? formatDataForDisplay(log.newData) : null;

    if (log.action === LogBlackType.CREATE) {
      return (
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-green-800 mb-2">Created Entry</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {newData?.senderName && (
                <div>
                  <span className="font-medium text-gray-600">Sender:</span>
                  <span className="ml-2 text-gray-900">{newData.senderName}</span>
                </div>
              )}
              {newData?.isActive !== undefined && (
                <div>
                  <span className="font-medium text-gray-600">Status:</span>
                  <Badge variant={newData.isActive ? "default" : "outline"} className="ml-2">
                    {newData.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              )}
              {newData?.effectiveDate && (
                <div>
                  <span className="font-medium text-gray-600">Effective Date:</span>
                  <span className="ml-2 text-gray-900">{newData.effectiveDate}</span>
                </div>
              )}
              {newData?.description && (
                <div className="md:col-span-2">
                  <span className="font-medium text-gray-600">Description:</span>
                  <span className="ml-2 text-gray-900">{newData.description}</span>
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-red-800 mb-2">Deleted Entry</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {oldData?.senderName && (
                <div>
                  <span className="font-medium text-gray-600">Sender:</span>
                  <span className="ml-2 text-gray-900">{oldData.senderName}</span>
                </div>
              )}
              {oldData?.description && (
                <div className="md:col-span-2">
                  <span className="font-medium text-gray-600">Description:</span>
                  <span className="ml-2 text-gray-900">{oldData.description}</span>
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
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">Before Changes</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium text-gray-600">Status:</span>
                <Badge variant={oldData.isActive ? "default" : "outline"} className="ml-2">
                  {oldData.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              {oldData.description !== undefined && (
                <div>
                  <span className="font-medium text-gray-600">Description:</span>
                  <span className="ml-2 text-gray-900">{oldData.description || "None"}</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {newData && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-green-800 mb-2">After Changes</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium text-gray-600">Status:</span>
                <Badge variant={newData.isActive ? "default" : "outline"} className="ml-2">
                  {newData.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              {newData.description !== undefined && (
                <div>
                  <span className="font-medium text-gray-600">Description:</span>
                  <span className="ml-2 text-gray-900">{newData.description || "None"}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const getSenderName = (log: BlacklistLogWithUser): string => {
    const data = log.newData || log.oldData;
    if (!data) return "Unknown";
    
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    return parsed.senderName || "Unknown";
  };

  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Audit Logs</h3>
          <p className="text-gray-500">No changes have been recorded yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Blacklist Audit Trail
          </CardTitle>
          <CardDescription>
            Detailed history of changes made to sender blacklist entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
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
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleRow(log.id)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleRow(log.id)}
                          className="p-1 hover:bg-gray-200 rounded"
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
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {log.user.name || "Unknown User"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm text-gray-600">
                            {format(new Date(log.timestamp), "PPP p")}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedRows.has(log.id) && (
                      <TableRow>
                        <TableCell colSpan={5} className="bg-gray-50 p-6">
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
    </div>
  );
}