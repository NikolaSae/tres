///components/services/ServiceFilters.tsx
"use client";
import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, X, Filter } from 'lucide-react';
import { ServiceType } from '@prisma/client';

interface ServiceFiltersProps {
  currentFilters: {
    type?: string;
    query?: string;
    status?: string;
  };
  onFilterChange: (filters: { type?: string; query?: string; status?: string }) => void;
  resultsCount?: number;
  totalCount?: number;
}

export function ServiceFilters({ 
  currentFilters, 
  onFilterChange, 
  resultsCount, 
  totalCount 
}: ServiceFiltersProps) {
  
  const handleTypeChange = (value: string) => {
    const newFilters = { 
      ...currentFilters, 
      type: value === 'all' ? undefined : value 
    };
    onFilterChange(newFilters);
  };
  
  const handleStatusChange = (value: string) => {
    const newFilters = { 
      ...currentFilters, 
      status: value === 'all' ? undefined : value 
    };
    onFilterChange(newFilters);
  };
  
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFilters = { 
      ...currentFilters, 
      query: e.target.value.trim() || undefined 
    };
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    onFilterChange({});
  };

  // Check if any filters are active
  const hasActiveFilters = !!(currentFilters.type || currentFilters.query || currentFilters.status);

  // Get service type display name
  const getServiceTypeDisplayName = (type: string) => {
    switch (type) {
      case ServiceType.VAS:
        return 'VAS';
      case ServiceType.BULK:
        return 'Bulk';
      case ServiceType.HUMANITARIAN:
        return 'Humanitarian';
      case ServiceType.PARKING:
        return 'Parking';
      default:
        return type;
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Filter controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Service Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Service Type</label>
              <Select
                value={currentFilters.type || 'all'}
                onValueChange={handleTypeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value={ServiceType.VAS}>VAS</SelectItem>
                  <SelectItem value={ServiceType.BULK}>Bulk</SelectItem>
                  <SelectItem value={ServiceType.HUMANITARIAN}>Humanitarian</SelectItem>
                  <SelectItem value={ServiceType.PARKING}>Parking</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={currentFilters.status || 'all'}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Search Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search services..."
                  value={currentFilters.query || ''}
                  onChange={handleQueryChange}
                  className="pl-10"
                />
                {currentFilters.query && (
                  <button
                    onClick={() => handleQueryChange({ target: { value: '' } } as any)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Reset Button */}
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={!hasActiveFilters}
                className="w-full"
              >
                <X className="mr-2 h-4 w-4" />
                Reset Filters
              </Button>
            </div>
          </div>

          {/* Active Filters & Results Summary */}
          {(hasActiveFilters || (resultsCount !== undefined && totalCount !== undefined)) && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t">
              {/* Active Filters */}
              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span className="text-sm">Active filters:</span>
                  
                  {currentFilters.type && (
                    <Badge variant="secondary" className="text-xs">
                      Type: {getServiceTypeDisplayName(currentFilters.type)}
                      <button
                        onClick={() => handleTypeChange('all')}
                        className="ml-1 hover:text-gray-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  
                  {currentFilters.status && (
                    <Badge variant="secondary" className="text-xs">
                      Status: {currentFilters.status === 'active' ? 'Active' : 'Inactive'}
                      <button
                        onClick={() => handleStatusChange('all')}
                        className="ml-1 hover:text-gray-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  
                  {currentFilters.query && (
                    <Badge variant="secondary" className="text-xs">
                      Search: "{currentFilters.query}"
                      <button
                        onClick={() => handleQueryChange({ target: { value: '' } } as any)}
                        className="ml-1 hover:text-gray-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                </div>
              )}
              
              {/* Results Count */}
              {resultsCount !== undefined && totalCount !== undefined && (
                <div className="text-sm">
                  Showing {resultsCount} of {totalCount} services
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}