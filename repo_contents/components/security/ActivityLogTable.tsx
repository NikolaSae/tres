// Path: components/security/ActivityLogTable.tsx

import React from 'react'; // Nije "use client" jer je ovo samo renderovanje
import { LogSeverity } from "@prisma/client";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface ActivityLogEntry {
  id: string;
  action: string;
  entityType: string | null;
  entityId?: string | null;
  details?: string | null;
  severity: LogSeverity;
  userId: string | null;
  user?: {
    id: string;
    name?: string | null;
    email: string;
    role: string;
  } | null;
  createdAt: Date;
}

interface ActivityLogTableProps {
  logs: ActivityLogEntry[]; // Prihvata logove kao prop
}

export default function ActivityLogTable({ logs }: ActivityLogTableProps) {

  const severityColors = {
    [LogSeverity.INFO]: "bg-blue-100 text-blue-800",
    [LogSeverity.WARNING]: "bg-yellow-100 text-yellow-800",
    [LogSeverity.ERROR]: "bg-red-100 text-red-800",
    [LogSeverity.CRITICAL]: "bg-purple-100 text-purple-800",
  };

  if (!logs || logs.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 border rounded-md">
        No activity logs found matching the criteria.
      </div>
    );
  }

  return (
     <div className="overflow-x-auto border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap">Time (UTC)</TableHead>
            <TableHead className="whitespace-nowrap">User</TableHead>
            <TableHead className="whitespace-nowrap">Action</TableHead>
            <TableHead className="whitespace-nowrap">Entity</TableHead>
            <TableHead className="whitespace-nowrap">Severity</TableHead>
            <TableHead className="max-w-xs whitespace-nowrap">Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="whitespace-nowrap">
                 {/* API server strana vraca Date objekte, formatirajte ih */}
                {log.createdAt ? format(log.createdAt, "yyyy-MM-dd HH:mm:ss") : '-'}
              </TableCell>
              <TableCell className="whitespace-nowrap">{log.user?.name || log.user?.email || log.userId || 'System'}</TableCell>
              <TableCell className="whitespace-nowrap">
                {log.action}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {log.entityType}
                {(log.entityId || log.entityId === null) && <span className="text-xs text-gray-500 ml-1">({log.entityId === null ? 'NULL' : log.entityId})</span>}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <Badge
                  className={severityColors[log.severity]}
                  variant="outline"
                >
                  {log.severity}
                </Badge>
              </TableCell>
              <TableCell className="max-w-xs truncate">
                 <span title={log.details || ""}>
                   {log.details || "-"}
                 </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
  );
}