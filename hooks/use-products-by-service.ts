// hooks/use-products-by-service.ts

import { useState, useEffect } from 'react';
import { getProductsByService } from '@/actions/products/get-by-service';
import { Product } from '@/lib/types/interfaces';

interface UseProductsByServiceResult {
  products: Product[];
  isLoading: boolean;
  error: Error | null;
  mutate: () => Promise<void>;
}

export function useProductsByService(serviceId?: string): UseProductsByServiceResult {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchProducts = async () => {
    if (!serviceId) {
      setProducts([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await getProductsByService({ serviceId });
      setProducts(data);
    } catch (err) {
      console.error('Error fetching products for service:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch products'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [serviceId]);

  const mutate = async () => {
    await fetchProducts();
  };

  return { products, isLoading, error, mutate };
}