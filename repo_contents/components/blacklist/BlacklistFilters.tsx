// components/blacklist/BlacklistFilters.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { BlacklistFilters } from "@/hooks/use-sender-blacklist";
import { useProviders } from "@/hooks/use-providers";

interface BlacklistFiltersComponentProps {
  initialFilters: BlacklistFilters;
  onFilterChange: (filters: BlacklistFilters) => void;
}

export function BlacklistFiltersComponent({ 
  initialFilters, 
  onFilterChange 
}: BlacklistFiltersComponentProps) {
  // Osiguravamo da localFilters nikad nije undefined ili null
  const [localFilters, setLocalFilters] = useState<BlacklistFilters>(initialFilters || {});
  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);

  // Get providers for the dropdown
  const { providers } = useProviders();

  useEffect(() => {
    // Osiguravamo da je initialFilters prazan objekat ako je undefined/null
    setLocalFilters(initialFilters || {});
  }, [initialFilters]);

  const handleFilterChange = (key: keyof BlacklistFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters = {};
    setLocalFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  // Dodajemo sigurnosnu proveru da localFilters nije null/undefined
  const hasActiveFilters = localFilters && Object.keys(localFilters).some(key => {
    const value = localFilters[key as keyof BlacklistFilters];
    return value !== undefined && value !== null && value !== '';
  });

  return (
    <div className="space-y-4 p-4 rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
          >
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="space-y-2">
          <Label htmlFor="senderName">Sender Name</Label>
          <Input
            id="senderName"
            placeholder="Search sender name..."
            value={localFilters?.senderName || ''}
            onChange={(e) => handleFilterChange('senderName', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="provider">Provider</Label>
          <Select
            value={localFilters?.providerId || 'all'}
            onValueChange={(value) => handleFilterChange('providerId', value === 'all' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All providers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All providers</SelectItem>
              {providers?.map(provider => (
                <SelectItem key={provider.id} value={provider.id}>
                  {provider.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={localFilters?.isActive === undefined ? 'all' : localFilters.isActive.toString()}
            onValueChange={(value) => handleFilterChange('isActive', value === 'all' ? undefined : value === 'true')}
          >
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Date From</Label>
          <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {localFilters?.dateFrom ? format(localFilters.dateFrom, "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={localFilters?.dateFrom}
                onSelect={(date) => {
                  handleFilterChange('dateFrom', date);
                  setDateFromOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Date To</Label>
          <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {localFilters?.dateTo ? format(localFilters.dateTo, "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={localFilters?.dateTo}
                onSelect={(date) => {
                  handleFilterChange('dateTo', date);
                  setDateToOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}