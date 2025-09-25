// Final ActivityLog.tsx code (with optional initial props, adjusted useEffect, debouncing, split Entity columns, NO console logs)

// Path: components/security/ActivityLog.tsx

"use client";

import React, { useState, useEffect, useRef } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, FilterIcon, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis
} from "@/components/ui/pagination";

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

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

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ActivityLogProps {
  initialLogs?: ActivityLogEntry[]; // Make prop optional
  initialPagination?: PaginationInfo; // Make prop optional
  showFilters?: boolean;
  initialLimit?: number; // Use this if initialPagination.limit is not provided
}

const possibleEntityTypes = ['User', 'Contract', 'Provider', 'Organization', 'System', 'Report', 'complaint', 'Settings'];


export default function ActivityLog({
  initialLogs,
  initialPagination,
  showFilters = true,
  initialLimit = 20 // Default value for limit if not in initialPagination
}: ActivityLogProps) {
  // Initialize state based on provided initial props or defaults
  const defaultLimit = initialPagination?.limit || initialLimit;
  const [logs, setLogs] = useState<ActivityLogEntry[]>(initialLogs || []);
  const [pagination, setPagination] = useState<PaginationInfo>(initialPagination || { total: 0, page: 1, limit: defaultLimit, totalPages: 0 });

  const [loading, setLoading] = useState<boolean>(false);
  const [filters, setFilters] = useState({
    action: "",
    entityType: "all",
    severity: "all",
    userId: "",
    userName: "",
    startDate: null as Date | null,
    endDate: null as Date | null,
  });

  const debouncedUserName = useDebounce(filters.userName, 500);

  // Initialize currentPage and currentLimit based on initialPagination or defaults
  const [currentPage, setCurrentPage] = useState(initialPagination?.page || 1);
  const [currentLimit, setCurrentLimit] = useState(initialPagination?.limit || defaultLimit);


  const isInitialMount = useRef(true);
  const [mounted, setMounted] = useState(false);


  const buildQueryParams = () => {
    const params = new URLSearchParams();

    if (filters.action) params.append("action", filters.action);

    if (filters.entityType && filters.entityType !== "all") {
      params.append("entityType", filters.entityType);
    }

    if (filters.userId) params.append("userId", filters.userId);
    // Use the immediate userName state for param building (debounce controls when the effect that calls this runs)
    if (filters.userName) params.append("userName", filters.userName);


    if (filters.severity && filters.severity !== "all") {
      params.append("severity", filters.severity);
    }
    if (filters.startDate) params.append("startDate", filters.startDate.toISOString());
    if (filters.endDate) params.append("endDate", filters.endDate.toISOString());

    params.append("page", currentPage.toString());
    params.append("limit", currentLimit.toString());

    return params.toString();
  };

  const fetchLogs = async () => {
    setLoading(true);
    const queryParams = buildQueryParams();

    try {
      const response = await fetch(`/api/security/logs?${queryParams}`);
      if (!response.ok) {
          const errorData = await response.json();
          console.error("API Error fetching logs:", response.status, errorData);
          setLogs([]);
          setPagination({ total: 0, page: currentPage, limit: currentLimit, totalPages: 0 });
          return;
      }

      const data = await response.json();
      setLogs(data.logs);
      setPagination(data.pagination);

    } catch (error) {
      console.error("Fetch Error fetching logs:", error);
      setLogs([]);
      setPagination({ total: 0, page: currentPage, limit: currentLimit, totalPages: 0 });
    } finally {
      setLoading(false);
    }
  };

   useEffect(() => {
        // This flag ensures the effect runs only AFTER the very first render.
        // If initialLogs were provided, the state is initialized, and this first run will be skipped by this flag.
        // If initialLogs were NOT provided, the state is initialized to defaults, this flag still runs,
        // and the fetchLogs() call *inside* this useEffect will be the *first* fetch.

        if (isInitialMount.current) {
          isInitialMount.current = false;
          // If initialLogs were PROVIDED, we want to skip the fetch ONCE.
          // If initialLogs were NOT PROVIDED, we WANT to fetch on the first render.
          // So, skip if initialLogs was explicitly passed as a prop (even if empty array).
          // Check for initialLogs !== undefined to distinguish from not passed at all.
          if (initialLogs !== undefined) {
             return; // Skip fetch on initial mount if initial data was explicitly provided
          }
        }

        // This fetchLogs call will run on:
        // 1. The very first render IF initialLogs was undefined (due to the !isInitialMount check logic)
        // 2. Subsequent renders when any dependency changes (because !isInitialMount.current is true)
        fetchLogs();

   }, [filters.action, filters.entityType, filters.severity, filters.userId, filters.startDate, filters.endDate, debouncedUserName, currentPage, currentLimit]);


  useEffect(() => {
      setMounted(true);
  }, []);


  const handleFilterChange = (name: string, value: any) => {
    setFilters(prev => ({ ...prev, [name]: value }));
     setCurrentPage(1); // Reset page for any filter change
  };

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= pagination.totalPages) {
            setCurrentPage(page);
        }
    };

     const handleLimitChange = (value: string) => {
         const newLimit = parseInt(value, 10);
         if (!isNaN(newLimit) && newLimit > 0) {
             setCurrentLimit(newLimit);
             setCurrentPage(1);
         }
     };


  const resetFilters = () => {
    setFilters({
      action: "",
      entityType: "all",
      severity: "all",
      userId: "",
      userName: "",
      startDate: null,
      endDate: null,
    });
    setCurrentPage(1);
  };

  const severityColors = {
    [LogSeverity.INFO]: "bg-blue-100 text-blue-800",
    [LogSeverity.WARNING]: "bg-yellow-100 text-yellow-800",
    [LogSeverity.ERROR]: "bg-red-100 text-red-800",
    [LogSeverity.CRITICAL]: "bg-purple-100 text-purple-800",
  };

    const getPaginationItemProps = (page: number) => {
        if (page < 1 || page > pagination.totalPages) return null;
        return {
            isActive: page === pagination.page,
            onClick: () => handlePageChange(page),
        };
    };

     const getPaginationPages = () => {
         const pages = [];
         const total = pagination.totalPages;
         const current = pagination.page;
         const delta = 2;

         if (total <= 7) {
             for (let i = 1; i <= total; i++) {
                 pages.push(i);
             }
         } else {
             pages.push(1);

             if (current > delta + 2 && total > delta + 3) {
                 pages.push(-1);
             }

             for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
                 pages.push(i);
             }

             if (current < total - delta - 1 && total > delta + 3) {
                  if (pages[pages.length - 1] !== -1) {
                     pages.push(-1);
                  }
             }

             pages.push(total);
         }


         return Array.from(new Set(pages)).sort((a, b) => a - b);
     };


  return (
    <div className="space-y-4">
      {mounted ? (
       showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg border mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Filters</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={resetFilters} disabled={loading}>
                Reset
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Action</label>
              <Input
                placeholder="Filter by action"
                value={filters.action}
                onChange={(e) => handleFilterChange("action", e.target.value)}
                className="mt-1"
                disabled={loading}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Entity Type</label>
              <Select
                value={filters.entityType}
                onValueChange={(value) => handleFilterChange("entityType", value)}
                disabled={loading}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All entity types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entity Types</SelectItem>
                  {possibleEntityTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Severity</label>
              <Select
                value={filters.severity}
                onValueChange={(value) => handleFilterChange("severity", value)}
                  disabled={loading}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All severities</SelectItem>
                  <SelectItem value={LogSeverity.INFO}>Info</SelectItem>
                  <SelectItem value={LogSeverity.WARNING}>Warning</SelectItem>
                  <SelectItem value={LogSeverity.ERROR}>Error</SelectItem>
                  <SelectItem value={LogSeverity.CRITICAL}>Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

             <div>
              <label className="text-sm font-medium">User Name</label>
              <Input
                placeholder="Filter by user name"
                value={filters.userName}
                onChange={(e) => handleFilterChange("userName", e.target.value)}
                className="mt-1"
                disabled={loading}
              />
             </div>

             <div>
              <label className="text-sm font-medium">User ID</label>
              <Input
                placeholder="Filter by user ID"
                value={filters.userId}
                onChange={(e) => handleFilterChange("userId", e.target.value)}
                className="mt-1"
                disabled={loading}
              />
             </div>

              <div>
                 <label className="text-sm font-medium">Logs per page</label>
                  <Select
                     value={currentLimit.toString()}
                     onValueChange={(value) => handleLimitChange(value)}
                     disabled={loading}
                  >
                     <SelectTrigger className="mt-1">
                       <SelectValue placeholder="Select limit" />
                     </SelectTrigger>
                     <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                     </SelectContent>
                   </Select>
              </div>


            <div>
              <label className="text-sm font-medium">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal mt-1"
                    disabled={loading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.startDate ? format(filters.startDate, "yyyy-MM-dd") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.startDate || undefined}
                    onSelect={(date) => handleFilterChange("startDate", date)}
                    initialFocus
                    disabled={loading}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-sm font-medium">End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal mt-1"
                    disabled={loading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.endDate ? format(filters.endDate, "yyyy-MM-dd") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.endDate || undefined}
                    onSelect={(date) => handleFilterChange("endDate", date)}
                    initialFocus
                    disabled={loading}
                  />
                </PopoverContent>
              </Popover>
            </div>


          </div>
        </div>
       )
      ) : (
         null
      )}


      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Activity Logs ({pagination.total} total)</h2>
         {mounted ? (
           <Button variant="ghost" size="sm" onClick={fetchLogs} disabled={loading}>
             <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
             Refresh
           </Button>
         ) : (
             null
         )}
      </div>

      {mounted ? (
        loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-500">
            No activity logs found matching the criteria.
          </div>
        ) : (
          <div className="overflow-x-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Time (UTC)</TableHead>
                  <TableHead className="whitespace-nowrap">User</TableHead>
                  <TableHead className="whitespace-nowrap">Action</TableHead>
                  <TableHead className="whitespace-nowrap">Entity Type</TableHead>
                  <TableHead className="whitespace-nowrap">Entity ID</TableHead>
                  <TableHead className="whitespace-nowrap">Severity</TableHead>
                  <TableHead className="max-w-xs whitespace-nowrap">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {log.createdAt ? format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss") : '-'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{log.user?.name || log.user?.email || log.userId || 'System'}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {log.action}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {log.entityType || '-'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                       {log.entityId === null ? 'NULL' : log.entityId || '-'}
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
        )
      ) : (
         null
      )}


       {mounted && pagination.totalPages > 1 && (
           <div className="flex justify-center mt-4">
               <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page <= 1 || loading} />
                        </PaginationItem>

                         {getPaginationPages().map((page, index) => (
                            page === -1 ? (
                                 <PaginationItem key={`ellipsis-${index}`}>
                                     <PaginationEllipsis />
                                 </PaginationItem>
                             ) : (
                                 <PaginationItem key={page}>
                                     <Button
                                         variant={page === pagination.page ? 'outline' : 'ghost'}
                                         onClick={() => handlePageChange(page)}
                                         disabled={loading}
                                     >
                                         {page}
                                     </Button>
                                 </PaginationItem>
                            )
                         ))}


                        <PaginationItem>
                            <PaginationNext onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages || loading} />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
                <div className="ml-4 text-sm text-muted-foreground flex items-center">
                    Total: {pagination.total} logs
                </div>
            </div>
        )}
    </div>
  );
}