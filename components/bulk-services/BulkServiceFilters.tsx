//components/bulk-services/BulkServiceFilters.tsx


"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchIcon, FilterIcon, X, ChevronDown } from "lucide-react";

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
import { Separator } from "@/components/ui/separator";
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
  const [provider, setProvider] = useState(searchParams.get("provider") || "");
  const [service, setService] = useState(searchParams.get("service") || "");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  
  // Count active filters
  const activeFiltersCount = [provider, service].filter(Boolean).length;

  // Handle filter changes
  const applyFilters = () => {
    const params = new URLSearchParams(searchParams);
    
    if (search) {
      params.set("search", search);
    } else {
      params.delete("search");
    }
    
    if (provider) {
      params.set("provider", provider);
    } else {
      params.delete("provider");
    }
    
    if (service) {
      params.set("service", service);
    } else {
      params.delete("service");
    }
    
    router.push(`${pathname}?${params.toString()}`);
  };

  // Reset filters
  const resetFilters = () => {
    setSearch("");
    setProvider("");
    setService("");
    router.push(pathname);
  };

  // Apply search on enter key
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      applyFilters();
    }
  };

  // Apply filters on mount to sync with URL params
  useEffect(() => {
    setSearch(searchParams.get("search") || "");
    setProvider(searchParams.get("provider") || "");
    setService(searchParams.get("service") || "");
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

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search bulk services..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
        </div>
        <div className="flex gap-2">
          <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <FilterIcon className="h-4 w-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1 rounded-full px-1.5 py-0.5">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 sm:w-80 p-4" align="end">
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Filter Bulk Services</h4>
                
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Provider</label>
                  <Select value={provider} onValueChange={setProvider}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Providers</SelectItem>
                      {providers.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Service</label>
                  <Select value={service} onValueChange={setService}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Services</SelectItem>
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
                
                <div className="flex justify-between pt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={resetFilters}
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
                    Apply Filters
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
      
      {/* Active filters */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          
          {provider && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Provider: {getProviderName(provider)}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => {
                  setProvider("");
                  const params = new URLSearchParams(searchParams);
                  params.delete("provider");
                  router.push(`${pathname}?${params.toString()}`);
                }}
              />
            </Badge>
          )}
          
          {service && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Service: {getServiceName(service)}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => {
                  setService("");
                  const params = new URLSearchParams(searchParams);
                  params.delete("service");
                  router.push(`${pathname}?${params.toString()}`);
                }}
              />
            </Badge>
          )}
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 text-xs text-muted-foreground"
            onClick={resetFilters}
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
};