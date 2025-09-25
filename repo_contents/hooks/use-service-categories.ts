// hooks/use-service-categories.ts
import { useState, useEffect } from "react";
import { ServiceType } from "@/lib/types/enums";
import { Service } from "@/lib/types/interfaces";

interface UseServiceCategoriesResult {
  categories: ServiceType[];
  services: Service[];
  isLoading: boolean;
  error: string | null;
}

export function useServiceCategories(): UseServiceCategoriesResult {
  const [categories, setCategories] = useState<ServiceType[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServiceCategories = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch("/api/services/categories", {
          credentials: 'include' // Ensure cookies are sent
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Authentication required');
          }
          throw new Error(`Request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        setCategories(data.categories);
        setServices(data.services);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error("Service categories fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServiceCategories();
  }, []);

  return { categories, services, isLoading, error };
}