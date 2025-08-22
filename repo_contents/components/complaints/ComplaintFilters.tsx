// /components/complaints/ComplaintFilters.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { ComplaintStatus } from "@prisma/client";
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
import { X, Filter, Loader2 } from "lucide-react"; // Dodat Loader2
// IMPORT useSession hook
import { useSession } from "next-auth/react"; // Prilagodite putanju ako je potrebno

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

export function ComplaintFilters({
  filters,
  onFiltersChange
}: ComplaintFiltersProps) {
  // Koristimo useSession hook da pratimo status sesije
  const { data: session, status: sessionStatus } = useSession(); 

  const [isOpen, setIsOpen] = useState(false);
  const [services, setServices] = useState<{ id: string; name: string }[]>([]);
  const [providers, setProviders] = useState<{ id: string; name: string }[]>([]);
  // ISPRAVLJENO: Inicijalizacija sa podrazumevanom vrednošću ako je filters undefined
  const [tempFilters, setTempFilters] = useState<ComplaintFiltersState>(filters || {
    statuses: [],
    serviceId: undefined,
    providerId: undefined,
    dateRange: { from: undefined, to: undefined }
  });

  // Dodat useEffect da sinhronizuje tempFilters sa eksternim filters propom
  // Ovo je korisno ako se filters prop menja od strane roditelja *nakon* inicijalnog renderovanja
  useEffect(() => {
      setTempFilters(filters || {
        statuses: [],
        serviceId: undefined,
        providerId: undefined,
        dateRange: { from: undefined, to: undefined }
      });
  }, [filters]); // Zavisnost od filters propa

  // Fetch services when session is authenticated
  useEffect(() => {
    const loadServices = async () => {
      try {
        const servicesData = await getServicesByCategory();
        setServices(servicesData || []); // Osiguravamo da je niz
      } catch (error) {
        console.error("Failed to load services", error);
        setServices([]); // Resetujemo na prazan niz pri grešci
      }
    };

    // KLJUČNA IZMENA: Fetch services ONLY IF session is authenticated
    if (sessionStatus === 'authenticated') {
      loadServices();
    } else if (sessionStatus === 'unauthenticated') {
        // Ako sesija nije autentikovana, resetujemo servise
        setServices([]);
    }

  }, [sessionStatus]); // Dependency na sessionStatus

  // Fetch providers when service changes AND session is authenticated
  useEffect(() => {
    const loadProviders = async () => {
      // Pristup tempFilters.serviceId je sada bezbedan
      if (tempFilters.serviceId) {
        try {
          const providersData = await getProvidersByService(tempFilters.serviceId);
          setProviders(providersData || []); // Osiguravamo da je niz
        } catch (error) {
          console.error("Failed to load providers", error);
          setProviders([]); // Resetujemo na prazan niz pri grešci
        }
      } else {
        setProviders([]);
      }
    };

    // KLJUČNA IZMENA: Fetch providers ONLY IF serviceId exists AND session is authenticated
    if (tempFilters.serviceId && sessionStatus === 'authenticated') {
      loadProviders();
    } else if (!tempFilters.serviceId || sessionStatus === 'unauthenticated') {
        // Resetujemo provajdere ako serviceId ne postoji ili sesija nije autentikovana
        setProviders([]);
    }

  }, [tempFilters.serviceId, sessionStatus]); // Dependencies na serviceId i sessionStatus


  // Handle status toggling
  const toggleStatus = (status: ComplaintStatus) => {
    setTempFilters(prev => {
      const currentStatuses = prev.statuses || [];
      if (currentStatuses.includes(status)) {
        return {
          ...prev,
          statuses: currentStatuses.filter(s => s !== status)
        };
      } else {
        return {
          ...prev,
          statuses: [...currentStatuses, status]
        };
      }
    });
  };

  // Handle service selection
  const handleServiceChange = (serviceId: string | null) => {
    setTempFilters(prev => ({
      ...prev,
      serviceId: serviceId || undefined,
      providerId: undefined // Reset provider when service changes
    }));
  };

  // Handle provider selection
  const handleProviderChange = (providerId: string | null) => {
    setTempFilters(prev => ({
      ...prev,
      providerId: providerId || undefined
    }));
  };

  // Handle date range changes
  const handleDateRangeChange = (from?: Date, to?: Date) => {
    setTempFilters(prev => ({
      ...prev,
      dateRange: { from, to }
    }));
  };

  // Apply filters
  const applyFilters = () => {
    onFiltersChange(tempFilters);
    setIsOpen(false);
  };

  // Reset filters
  const resetFilters = () => {
    const emptyFilters: ComplaintFiltersState = {
      statuses: [],
      serviceId: undefined,
      providerId: undefined,
      dateRange: { from: undefined, to: undefined }
    };

    setTempFilters(emptyFilters);
    onFiltersChange(emptyFilters);
    setIsOpen(false);
  };

  // Count active filters
  const activeFilterCount = [
    tempFilters.statuses?.length > 0,
    !!tempFilters.serviceId,
    !!tempFilters.providerId,
    !!(tempFilters.dateRange?.from || tempFilters.dateRange?.to)
  ].filter(Boolean).length;

  // Prikazujemo dugme za filter uvek, ali možemo ga disablovati dok se sesija učitava
  const isFilterButtonDisabled = sessionStatus === 'loading';

  return (
    <div className="mb-6">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
        disabled={isFilterButtonDisabled} // Disablovano dok se sesija učitava
      >
        {isFilterButtonDisabled ? (
            <>
                <Loader2 className="h-4 w-4 animate-spin" /> Loading...
            </>
        ) : (
            <>
                <Filter className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                <span className="ml-1 rounded-full bg-primary text-primary-foreground text-xs px-2">
                    {activeFilterCount}
                </span>
                )}
            </>
        )}
      </Button>

      {isOpen && sessionStatus === 'authenticated' && (
        <Card className="mt-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex justify-between items-center">
              Filter Complaints
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>

          <CardContent className="grid gap-6">
            <div>
              <Label className="mb-2 block">Status</Label>
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

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="mb-2 block">Service</Label>
                <ServiceCategoryFilter
                  services={services} // Prosleđujemo dobijene servise
                  selectedServiceId={tempFilters.serviceId}
                  onChange={handleServiceChange}
                />
              </div>

              <div>
                <Label className="mb-2 block">Provider</Label>
                <ProviderFilter
                  providers={providers} // Prosleđujemo dobijene provajdere
                  selectedProviderId={tempFilters.providerId}
                  onChange={handleProviderChange}
                  disabled={!tempFilters.serviceId || sessionStatus !== 'authenticated'} // Disablovano ako nema servisa ILI sesija nije učitana/autentikovana
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Date Range</Label>
              <DateRangeFilter
                fromDate={tempFilters.dateRange?.from}
                toDate={tempFilters.dateRange?.to}
                onChange={handleDateRangeChange}
              />
            </div>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={resetFilters}>
              Reset Filters
            </Button>
            <Button onClick={applyFilters}>
              Apply Filters
            </Button>
          </CardFooter>
        </Card>
      )}
      {isOpen && sessionStatus === 'loading' && (
          <Card className="mt-2 p-6 flex justify-center items-center">
              <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading filter options...
          </Card>
      )}
      {isOpen && sessionStatus === 'unauthenticated' && (
           <Card className="mt-2 p-6 text-center text-muted-foreground">
               You must be logged in to use filters.
           </Card>
      )}
    </div>
  );
}