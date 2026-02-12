// /components/complaints/ComplaintFilters.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { ComplaintStatus } from "@prisma/client";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { getServicesByCategory } from "@/actions/services/get-by-category";
import { getProvidersByService } from "@/actions/providers/get-by-service";
import ServiceCategoryFilter from "./ServiceCategoryFilter";
import ProviderFilter from "./ProviderFilter";
import DateRangeFilter from "./DateRangeFilter";
import { X, Filter, Loader2 } from "lucide-react";

export interface ComplaintFiltersState {
  statuses: ComplaintStatus[];
  serviceId?: string;
  providerId?: string;
  dateRange?: {
    from?: Date;
    to?: Date;
  };
}

interface ComplaintFiltersProps {
  filters?: ComplaintFiltersState;
  onFiltersChange: (filters: ComplaintFiltersState) => void;
}

const DEFAULT_FILTERS: ComplaintFiltersState = {
  statuses: [],
  serviceId: undefined,
  providerId: undefined,
  dateRange: { from: undefined, to: undefined }
};

export function ComplaintFilters({
  filters = DEFAULT_FILTERS,
  onFiltersChange
}: ComplaintFiltersProps) {
  const { data: session, status: sessionStatus } = useSession();

  const [isOpen, setIsOpen] = useState(false);
  const [services, setServices] = useState<{ id: string; name: string }[]>([]);
  const [providers, setProviders] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);
  const [tempFilters, setTempFilters] = useState<ComplaintFiltersState>(filters);

  // Sync tempFilters with external filters prop changes
  useEffect(() => {
    setTempFilters(filters);
  }, [filters]);

  // Fetch services when authenticated
  useEffect(() => {
    let isMounted = true;

    const loadServices = async () => {
      if (sessionStatus !== 'authenticated') {
        setServices([]);
        return;
      }

      setIsLoadingServices(true);
      try {
        const servicesData = await getServicesByCategory();
        if (isMounted) {
          setServices(servicesData || []);
        }
      } catch (error) {
        console.error("Failed to load services:", error);
        if (isMounted) {
          setServices([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingServices(false);
        }
      }
    };

    loadServices();

    return () => {
      isMounted = false;
    };
  }, [sessionStatus]);

  // Fetch providers when service changes
  useEffect(() => {
    let isMounted = true;

    const loadProviders = async () => {
      if (!tempFilters.serviceId || sessionStatus !== 'authenticated') {
        setProviders([]);
        return;
      }

      setIsLoadingProviders(true);
      try {
        const providersData = await getProvidersByService(tempFilters.serviceId);
        if (isMounted) {
          setProviders(providersData || []);
        }
      } catch (error) {
        console.error("Failed to load providers:", error);
        if (isMounted) {
          setProviders([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingProviders(false);
        }
      }
    };

    loadProviders();

    return () => {
      isMounted = false;
    };
  }, [tempFilters.serviceId, sessionStatus]);

  // Handler functions
  const toggleStatus = (status: ComplaintStatus) => {
    setTempFilters(prev => {
      const currentStatuses = prev.statuses || [];
      const newStatuses = currentStatuses.includes(status)
        ? currentStatuses.filter(s => s !== status)
        : [...currentStatuses, status];

      return { ...prev, statuses: newStatuses };
    });
  };

  const handleServiceChange = (serviceId: string | null) => {
    setTempFilters(prev => ({
      ...prev,
      serviceId: serviceId || undefined,
      providerId: undefined // Reset provider when service changes
    }));
  };

  const handleProviderChange = (providerId: string | null) => {
    setTempFilters(prev => ({
      ...prev,
      providerId: providerId || undefined
    }));
  };

  const handleDateRangeChange = (from?: Date, to?: Date) => {
    setTempFilters(prev => ({
      ...prev,
      dateRange: { from, to }
    }));
  };

  const applyFilters = () => {
    onFiltersChange(tempFilters);
    setIsOpen(false);
  };

  const resetFilters = () => {
    setTempFilters(DEFAULT_FILTERS);
    onFiltersChange(DEFAULT_FILTERS);
    setIsOpen(false);
  };

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    return [
      tempFilters.statuses?.length > 0,
      !!tempFilters.serviceId,
      !!tempFilters.providerId,
      !!(tempFilters.dateRange?.from || tempFilters.dateRange?.to)
    ].filter(Boolean).length;
  }, [tempFilters]);

  // Determine UI states
  const isAuthenticated = sessionStatus === 'authenticated';
  const isLoading = sessionStatus === 'loading';
  const isUnauthenticated = sessionStatus === 'unauthenticated';
  const isFilterButtonDisabled = isLoading;

  return (
    <div className="mb-6">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
        disabled={isFilterButtonDisabled}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          <>
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 rounded-full bg-primary text-primary-foreground text-xs px-2 py-0.5">
                {activeFilterCount}
              </span>
            )}
          </>
        )}
      </Button>

      {isOpen && isAuthenticated && (
        <Card className="mt-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex justify-between items-center">
              Filter Complaints
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                aria-label="Close filters"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>

          <CardContent className="grid gap-6">
            {/* Status Filter */}
            <div>
              <Label className="mb-2 block text-sm font-medium">Status</Label>
              <div className="flex flex-wrap gap-2">
                {Object.values(ComplaintStatus).map((status) => (
                  <Button
                    key={status}
                    type="button"
                    variant={tempFilters.statuses?.includes(status) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleStatus(status)}
                    className="text-xs"
                  >
                    {status.replace(/_/g, ' ')}
                  </Button>
                ))}
              </div>
            </div>

            {/* Service and Provider Filters */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="mb-2 block text-sm font-medium">Service</Label>
                {isLoadingServices ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading services...
                  </div>
                ) : (
                  <ServiceCategoryFilter
                    services={services}
                    selectedServiceId={tempFilters.serviceId}
                    onChange={handleServiceChange}
                  />
                )}
              </div>

              <div>
                <Label className="mb-2 block text-sm font-medium">Provider</Label>
                {isLoadingProviders ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading providers...
                  </div>
                ) : (
                  <ProviderFilter
                    providers={providers}
                    selectedProviderId={tempFilters.providerId}
                    onChange={handleProviderChange}
                    disabled={!tempFilters.serviceId}
                  />
                )}
              </div>
            </div>

            {/* Date Range Filter */}
            <div>
              <Label className="mb-2 block text-sm font-medium">Date Range</Label>
              <DateRangeFilter
                fromDate={tempFilters.dateRange?.from}
                toDate={tempFilters.dateRange?.to}
                onChange={handleDateRangeChange}
              />
            </div>
          </CardContent>

          <CardFooter className="flex justify-between pt-4">
            <Button variant="outline" onClick={resetFilters}>
              Reset Filters
            </Button>
            <Button onClick={applyFilters}>
              Apply Filters
            </Button>
          </CardFooter>
        </Card>
      )}

      {isOpen && isLoading && (
        <Card className="mt-2 p-6 flex justify-center items-center">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span className="text-sm text-muted-foreground">Loading filter options...</span>
        </Card>
      )}

      {isOpen && isUnauthenticated && (
        <Card className="mt-2 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            You must be logged in to use filters.
          </p>
        </Card>
      )}
    </div>
  );
}