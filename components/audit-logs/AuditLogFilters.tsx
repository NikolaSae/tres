// components/audit-logs/AuditLogFilters.tsx
"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { LogBlackType } from "@prisma/client";

type LogType = "blacklist";

interface FilterState {
  search?: string;
  action?: LogBlackType | "all";
  dateFrom?: Date;
  dateTo?: Date;
}

interface AuditLogFiltersProps {
  logType: LogType;
  initialFilters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  loading?: boolean;
}

const blacklistActions: (LogBlackType | "all")[] = ["all", "CREATE", "UPDATE", "DELETE", "ACTIVATE", "DEACTIVATE"];

export function AuditLogFilters({
  logType,
  initialFilters,
  onFilterChange,
  loading,
}: AuditLogFiltersProps) {
  const [search, setSearch] = useState(initialFilters.search || "");
  const [action, setAction] = useState<LogBlackType | "all">(initialFilters.action || "all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(initialFilters.dateFrom);
  const [dateTo, setDateTo] = useState<Date | undefined>(initialFilters.dateTo);

  // ✅ Debounce filter changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onFilterChange({
        search: search || undefined,
        action,
        dateFrom,
        dateTo,
      });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search, action, dateFrom, dateTo, onFilterChange]);

  const handleReset = () => {
    setSearch("");
    setAction("all");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const hasActiveFilters = search || action !== "all" || dateFrom || dateTo;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by sender, user name, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-10"
            disabled={loading}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              disabled={loading}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Action Filter */}
        <Select value={action} onValueChange={(value: any) => setAction(value)} disabled={loading}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by action..." />
          </SelectTrigger>
          <SelectContent>
            {blacklistActions.map((actionType) => (
              <SelectItem key={actionType} value={actionType}>
                {actionType === "all" ? "All Actions" : actionType.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date From */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full sm:w-[200px] justify-start text-left font-normal",
                !dateFrom && "text-muted-foreground"
              )}
              disabled={loading}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFrom ? format(dateFrom, "PPP") : "From date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateFrom}
              onSelect={setDateFrom}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Date To */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full sm:w-[200px] justify-start text-left font-normal",
                !dateTo && "text-muted-foreground"
              )}
              disabled={loading}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateTo ? format(dateTo, "PPP") : "To date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateTo}
              onSelect={setDateTo}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Reset */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={handleReset}
            disabled={loading}
            className="whitespace-nowrap"
          >
            Reset Filters
          </Button>
        )}
      </div>
    </div>
  );
}