// Path: components/humanitarian-orgs/HumanitarianOrgFilters.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { HumanitarianOrgFilterOptions } from "@/lib/types/humanitarian-org-types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface HumanitarianOrgFiltersProps {
  onFilterChange: (filters: HumanitarianOrgFilterOptions) => void;
  initialFilters: HumanitarianOrgFilterOptions;
}

export function HumanitarianOrgFilters({ onFilterChange, initialFilters }: HumanitarianOrgFiltersProps) {
  const [localFilters, setLocalFilters] = useState<HumanitarianOrgFilterOptions>(initialFilters);
  const [searchInput, setSearchInput] = useState(initialFilters.search || '');

  useEffect(() => {
    setLocalFilters(initialFilters);
    setSearchInput(initialFilters.search || '');
  }, [initialFilters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const newSearch = searchInput.trim() === '' ? undefined : searchInput.trim();

      if (newSearch !== localFilters.search) {
        const updatedFilters = { ...localFilters, search: newSearch };
        setLocalFilters(updatedFilters);
        onFilterChange(updatedFilters);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchInput, localFilters, onFilterChange]);

  const handleIsActiveChange = useCallback((value: string) => {
    const newValue = value === 'all' ? undefined : value === 'active';
    const updatedFilters = { ...localFilters, isActive: newValue };
    setLocalFilters(updatedFilters);
    onFilterChange(updatedFilters);
  }, [localFilters, onFilterChange]);

  const handleSortByChange = useCallback((value: string) => {
    const newValue = value as HumanitarianOrgFilterOptions['sortBy'];
    const updatedFilters = { ...localFilters, sortBy: newValue };
    setLocalFilters(updatedFilters);
    onFilterChange(updatedFilters);
  }, [localFilters, onFilterChange]);

  const handleSortDirectionChange = useCallback((value: string) => {
    const newValue = value as HumanitarianOrgFilterOptions['sortDirection'];
    const updatedFilters = { ...localFilters, sortDirection: newValue };
    setLocalFilters(updatedFilters);
    onFilterChange(updatedFilters);
  }, [localFilters, onFilterChange]);

  const handleHasContractsChange = useCallback((checked: boolean | 'indeterminate') => {
    const newValue = checked === true ? true : undefined;
    const updatedFilters = { ...localFilters, hasContracts: newValue };
    setLocalFilters(updatedFilters);
    onFilterChange(updatedFilters);
  }, [localFilters, onFilterChange]);

  const handleHasComplaintsChange = useCallback((checked: boolean | 'indeterminate') => {
    const newValue = checked === true ? true : undefined;
    const updatedFilters = { ...localFilters, hasComplaints: newValue };
    setLocalFilters(updatedFilters);
    onFilterChange(updatedFilters);
  }, [localFilters, onFilterChange]);

  const handleResetFilters = useCallback(() => {
    const resetFilters: HumanitarianOrgFilterOptions = {
      search: undefined,
      isActive: undefined,
      country: undefined,
      city: undefined,
      hasContracts: undefined,
      hasComplaints: undefined,
      sortBy: 'name',
      sortDirection: 'asc'
    };
    setSearchInput('');
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  }, [onFilterChange]);

  return (
    <div className="p-4 rounded-md border space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Search by name, email, contact..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <RadioGroup
            value={localFilters.isActive === undefined ? 'all' : localFilters.isActive ? 'active' : 'inactive'}
            onValueChange={handleIsActiveChange}
          >
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all">All</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="active" id="active" />
                <Label htmlFor="active">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="inactive" id="inactive" />
                <Label htmlFor="inactive">Inactive</Label>
              </div>
            </div>
          </RadioGroup>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sortBy">Sort By</Label>
          <div className="flex space-x-2">
            <Select
              value={localFilters.sortBy}
              onValueChange={handleSortByChange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="createdAt">Date Created</SelectItem>
                <SelectItem value="contractsCount">Contracts Count</SelectItem>
                <SelectItem value="complaintsCount">Complaints Count</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={localFilters.sortDirection}
              onValueChange={handleSortDirectionChange}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Relations</Label>
          <div className="flex space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasContracts"
                checked={localFilters.hasContracts === true}
                onCheckedChange={handleHasContractsChange}
              />
              <Label htmlFor="hasContracts">Has Contracts</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasComplaints"
                checked={localFilters.hasComplaints === true}
                onCheckedChange={handleHasComplaintsChange}
              />
              <Label htmlFor="hasComplaints">Has Complaints</Label>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <Button variant="outline" onClick={handleResetFilters}>
          Reset Filters
        </Button>
      </div>
    </div>
  );
}