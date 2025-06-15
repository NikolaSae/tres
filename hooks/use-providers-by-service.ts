// hooks/use-providers-by-service.ts

import { useState, useEffect } from 'react';
import { getProvidersByService } from '@/actions/providers/get-by-service';
import { Provider } from '@/lib/types/interfaces';

interface UseProvidersByServiceResult {
  providers: Provider[];
  isLoading: boolean;
  error: Error | null;
  mutate: () => Promise<void>;
}

export function useProvidersByService(serviceId?: string): UseProvidersByServiceResult {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchProviders = async () => {
    if (!serviceId) {
      setProviders([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await getProvidersByService({ serviceId });
      setProviders(data);
    } catch (err) {
      console.error('Error fetching providers for service:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch providers'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [serviceId]);

  const mutate = async () => {
    await fetchProviders();
  };

  return { providers, isLoading, error, mutate };
}