// components/products/ProductFilters.tsx
'use client';

import { useState, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, X } from "lucide-react";
import { ProductFilterOptions } from "@/lib/types/product-types";

interface ProductFiltersProps {
  onFilterChange: (filters: ProductFilterOptions) => void;
  initialFilters?: ProductFilterOptions;
}

/**
 * Component for filtering products by search term and active status
 */
export function ProductFilters({ onFilterChange, initialFilters }: ProductFiltersProps) {
  // Local state for filters
  const [search, setSearch] = useState(initialFilters?.search || "");
  const [isActive, setIsActive] = useState<boolean | undefined>(initialFilters?.isActive);

  // Handle search input change
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  // Handle active status change
  const handleActiveChange = useCallback((value: string) => {
    const activeValue = value === "all" ? undefined : value === "true";
    setIsActive(activeValue);
  }, []);

  // Apply filters
  const applyFilters = useCallback(() => {
    const filters: ProductFilterOptions = {};
    
    if (search.trim()) {
      filters.search = search.trim();
    }
    
    if (isActive !== undefined) {
      filters.isActive = isActive;
    }

    onFilterChange(filters);
  }, [search, isActive, onFilterChange]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearch("");
    setIsActive(undefined);
    onFilterChange({});
  }, [onFilterChange]);

  // Auto-apply filters when they change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      applyFilters();
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [applyFilters]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Search className="h-5 w-5" />
          Filter Products
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Input */}
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search by name, code, or description..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Active Status Filter */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={isActive === undefined ? "all" : isActive.toString()}
              onValueChange={handleActiveChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="true">Active Only</SelectItem>
                <SelectItem value="false">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Label>&nbsp;</Label> {/* Spacer for alignment */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={clearFilters}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {(search || isActive !== undefined) && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-muted-foreground">Active filters:</span>
              
              {search && (
                <div className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm">
                  <span>Search: "{search}"</span>
                  <button
                    onClick={() => {
                      setSearch("");
                    }}
                    className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              {isActive !== undefined && (
                <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-md text-sm">
                  <span>Status: {isActive ? "Active" : "Inactive"}</span>
                  <button
                    onClick={() => {
                      setIsActive(undefined);
                    }}
                    className="ml-1 hover:bg-green-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
