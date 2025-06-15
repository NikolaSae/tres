// Path: components/complaints/ServiceSelection.tsx
"use client";

import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface Service {
  id: string;
  name: string;
}

interface ServiceSelectionProps {
  entityId: string;
  entityType: string;
  selectedServiceId: string;
  onServiceSelect: (id: string) => void;
  providerCategory?: 'VAS' | 'BULK'; // Novi prop za tip provajdera
}

export function ServiceSelection({
  entityId,
  entityType,
  selectedServiceId,
  onServiceSelect,
  providerCategory, // Prihvatamo novi prop
}: ServiceSelectionProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentEndpoint, setCurrentEndpoint] = useState<string | null>(null); // Dodatni state za debug

  useEffect(() => {
    setServices([]);
    setError(null);
    setCurrentEndpoint(null); // Resetuj endpoint

    if (!entityId) return;

    const fetchServices = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let endpoint = '';

        if (entityType === "PROVIDER") {
          // Koristimo providerCategory prop umesto hardkodovane funkcije
          if (providerCategory === 'VAS') {
            endpoint = `/api/providers/${entityId}/vas-services`;
          } else if (providerCategory === 'BULK') {
            endpoint = `/api/providers/${entityId}/bulk-services`;
          } else {
            // Ako providerCategory nije definisan, ili je null/undefined
            // Možda treba da se odlučiš za podrazumevani tip (npr. VAS), ili da prikažeš grešku
            console.warn("Provider category not explicitly defined for PROVIDER type. Defaulting to VAS services.");
            endpoint = `/api/providers/${entityId}/vas-services`; // Podrazumevano na VAS ako tip nije jasan
          }
        } else if (entityType === "HUMANITARIAN") {
          endpoint = `/api/humanitarian-orgs/${entityId}/services`;
        } else if (entityType === "PARKING") {
          endpoint = `/api/parking-services/${entityId}/services`;
        } else if (entityType === "BULK") {
          // Ako je sam Service Type 'BULK' (iz radio dugmeta), uvek dohvaćamo BULK servise
          endpoint = `/api/providers/${entityId}/bulk-services`;
        }

        setCurrentEndpoint(endpoint); // Postavi endpoint za debug

        if (!endpoint) {
          throw new Error("Invalid entity type or provider category not determined.");
        }

        const response = await fetch(endpoint);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to load services: ${errorText || response.statusText}`);
        }

        const data = await response.json();
        setServices(data);
      } catch (err) {
        console.error("Error fetching services:", err);
        setError(err instanceof Error ? err.message : "Failed to load services");
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, [entityId, entityType, providerCategory]); // Dodaj providerCategory u zavisnosti hook-a

  return (
    <div>
      <Select
        value={selectedServiceId}
        onValueChange={onServiceSelect}
        disabled={isLoading || services.length === 0 || !!error}
      >
        <SelectTrigger>
          {isLoading ? (
            <Skeleton className="h-4 w-full" />
          ) : (
            <SelectValue placeholder={
              services.length === 0
                ? `No services available for this ${entityType.toLowerCase()}`
                : "Select a service"
            } />
          )}
        </SelectTrigger>
        <SelectContent>
          {services.map((service) => (
            <SelectItem key={service.id} value={service.id}>
              {service.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {error && (
        <div className="text-red-500 text-sm mt-2">
          Error: {error}. Please try again or contact support.
        </div>
      )}

      {/* Debug section */}
      <div className="mt-2 text-xs text-gray-500">
        <p>Selected entity ID: {entityId}</p>
        <p>Entity type: {entityType}</p>
        <p>Services loaded: {services.length}</p>
        <p>Provider category: {providerCategory || 'N/A'}</p> {/* Prikazujemo novi prop */}
        <p>API endpoint: {currentEndpoint || 'N/A'}</p>
      </div>
    </div>
  );
}