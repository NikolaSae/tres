//components/bulk-services/BulkServiceFilters.tsx
"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchIcon, FilterIcon, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Provider, Service } from "@prisma/client";

interface BulkServiceFiltersProps {
  providers?: Provider[];
  services?: Service[];
}

export const BulkServiceFilters = ({
  providers = [],
  services = []
}: BulkServiceFiltersProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [providerId, setProviderId] = useState(searchParams.get("providerId") || "");
  const [serviceId, setServiceId] = useState(searchParams.get("serviceId") || "");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  
  // Count active filters
  const activeFiltersCount = [providerId, serviceId].filter(Boolean).length;

  // Handle filter changes
  const applyFilters = () => {
    const params = new URLSearchParams();
    
    // Always reset to page 1 when applying filters
    params.set("page", "1");
    
    if (search.trim()) {
      params.set("search", search.trim());
    }
    
    if (providerId) {
      params.set("providerId", providerId);
    }
    
    if (serviceId) {
      params.set("serviceId", serviceId);
    }
    
    router.push(`${pathname}?${params.toString()}`);
  };

  // Reset filters
  const resetFilters = () => {
    setSearch("");
    setProviderId("");
    setServiceId("");
    router.push(pathname);
  };

  // Apply search on enter key
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      applyFilters();
    }
  };

  // Sync with URL params
  useEffect(() => {
    setSearch(searchParams.get("search") || "");
    setProviderId(searchParams.get("providerId") || "");
    setServiceId(searchParams.get("serviceId") || "");
  }, [searchParams]);

  // Get provider and service names for badges
  const getProviderName = (id: string) => {
    const found = providers.find(p => p.id === id);
    return found ? found.name : id;
  };

  const getServiceName = (id: string) => {
    const found = services.find(s => s.id === id);
    return found ? found.name : id;
  };

  // Remove individual filter
  const removeFilter = (filterType: 'provider' | 'service') => {
    const params = new URLSearchParams(searchParams);
    
    if (filterType === 'provider') {
      setProviderId("");
      params.delete("providerId");
    } else if (filterType === 'service') {
      setServiceId("");
      params.delete("serviceId");
    }
    
    // Reset to page 1
    params.set("page", "1");
    
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Card className="p-4 mb-6">
      <div className="space-y-4">
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by provider name..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
          </div>
          
          <div className="flex gap-2">
            <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2 whitespace-nowrap">
                  <FilterIcon className="h-4 w-4" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-1 rounded-full px-1.5 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">Filter Options</h4>
                    {activeFiltersCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setProviderId("");
                          setServiceId("");
                        }}
                      >
                        Clear all
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Provider</label>
                      <Select value={providerId} onValueChange={setProviderId}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="All providers" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All providers</SelectItem>
                          {providers.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Service</label>
                      <Select value={serviceId} onValueChange={setServiceId}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="All services" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All services</SelectItem>
                          {services
                            .filter(s => s.type === 'BULK')
                            .map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setProviderId("");
                        setServiceId("");
                      }}
                    >
                      Reset
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => {
                        applyFilters();
                        setIsFiltersOpen(false);
                      }}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            <Button onClick={applyFilters}>
              Search
            </Button>
          </div>
        </div>
        
        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 items-center pt-1">
            <span className="text-xs font-medium text-muted-foreground">Active filters:</span>
            
            {providerId && (
              <Badge 
                variant="secondary" 
                className="gap-1.5 pr-1 hover:bg-secondary/80 transition-colors"
              >
                <span className="text-xs">Provider: {getProviderName(providerId)}</span>
                <button
                  onClick={() => removeFilter('provider')}
                  className="ml-1 rounded-full hover:bg-secondary-foreground/10 p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            
            {serviceId && (
              <Badge 
                variant="secondary" 
                className="gap-1.5 pr-1 hover:bg-secondary/80 transition-colors"
              >
                <span className="text-xs">Service: {getServiceName(serviceId)}</span>
                <button
                  onClick={() => removeFilter('service')}
                  className="ml-1 rounded-full hover:bg-secondary-foreground/10 p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={resetFilters}
            >
              Clear all
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};