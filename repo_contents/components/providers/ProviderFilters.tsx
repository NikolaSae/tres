// components/providers/ProviderFilters.tsx
"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface FilterOptions {
  search?: string;
  isActive?: boolean;
  hasContracts?: boolean;
  hasComplaints?: boolean;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

interface ProviderFiltersProps {
  initialFilters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  loading?: boolean;
}

export function ProviderFilters({
  initialFilters,
  onFilterChange,
  loading = false
}: ProviderFiltersProps) {
  const [filters, setFilters] = useState<FilterOptions>({
  ...initialFilters,
  hasContracts: initialFilters.hasContracts || false,
  hasComplaints: initialFilters.hasComplaints || false,
});
  const [searchQuery, setSearchQuery] = useState(initialFilters.search || "");
  
  // Одложено претраживање
  useEffect(() => {
  const timer = setTimeout(() => {
    handleFilterChange('search', searchQuery || undefined);
  }, 500);

  return () => clearTimeout(timer);
}, [searchQuery]);

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const defaultFilters: FilterOptions = {
      search: undefined,
      isActive: undefined,
      hasContracts: false,
      hasComplaints: false,
      sortBy: "createdAt",
      sortDirection: "desc",
    };
    setFilters(defaultFilters);
    setSearchQuery("");
    onFilterChange(defaultFilters);
  };

  return (
    <div className="bg-card p-4 rounded-md border space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Претрага */}
        <div className="relative">
          <Input
            placeholder="Search providers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        </div>

        {/* Статус филтер */}
        <Select
          value={filters.isActive === undefined ? "all" : filters.isActive ? "active" : "inactive"}
          onValueChange={(value) => {
            const isActiveMap = {
              all: undefined,
              active: true,
              inactive: false,
            };
            handleFilterChange("isActive", isActiveMap[value as keyof typeof isActiveMap]);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {/* Сортирање */}
        <Select
          value={`${filters.sortBy || "createdAt"}-${filters.sortDirection || "desc"}`}
          onValueChange={(value) => {
            const [sortBy, sortDirection] = value.split("-");
            handleFilterChange("sortBy", sortBy);
            handleFilterChange("sortDirection", sortDirection);
          }}
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">Name (A-Z)</SelectItem>
            <SelectItem value="name-desc">Name (Z-A)</SelectItem>
            <SelectItem value="createdAt-desc">Newest first</SelectItem>
            <SelectItem value="createdAt-asc">Oldest first</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="has-contracts"
            checked={filters.hasContracts}
            onCheckedChange={(checked) => 
              handleFilterChange("hasContracts", checked === true)
            }
          />
          <label
            htmlFor="has-contracts"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Has contracts
          </label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="has-complaints"
            checked={filters.hasComplaints}
            onCheckedChange={(checked) => 
              handleFilterChange("hasComplaints", checked === true)
            }
          />
          <label
            htmlFor="has-complaints"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Has complaints
          </label>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="ml-auto"
        >
          <X className="mr-2 h-4 w-4" />
          Reset Filters
        </Button>
      </div>
    </div>
  );
}