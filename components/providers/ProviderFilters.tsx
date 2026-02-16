// components/providers/ProviderFilters.tsx
"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, ArrowUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface FilterState {
  search?: string;
  sortBy?: 'name' | 'email' | 'phone';
  sortOrder?: 'asc' | 'desc';
}

interface ProviderFiltersProps {
  initialFilters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  loading?: boolean;
}

export function ProviderFilters({ 
  initialFilters, 
  onFilterChange, 
  loading 
}: ProviderFiltersProps) {
  const [search, setSearch] = useState(initialFilters.search || '');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'phone'>(initialFilters.sortBy || 'name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialFilters.sortOrder || 'asc');

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onFilterChange({ search, sortBy, sortOrder });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search, sortBy, sortOrder, onFilterChange]);

  const handleClearSearch = () => {
    setSearch('');
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const handleReset = () => {
    setSearch('');
    setSortBy('name');
    setSortOrder('asc');
  };

  const hasActiveFilters = search || sortBy !== 'name' || sortOrder !== 'asc';

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search providers by name, contact, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-10"
            disabled={loading}
          />
          {search && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              disabled={loading}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Select value={sortBy} onValueChange={(value: 'name' | 'email' | 'phone') => setSortBy(value)} disabled={loading}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Sort by Name</SelectItem>
            <SelectItem value="email">Sort by Email</SelectItem>
            <SelectItem value="phone">Sort by Phone</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          onClick={toggleSortOrder}
          disabled={loading}
          title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
        >
          <ArrowUpDown className={`h-4 w-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
        </Button>

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