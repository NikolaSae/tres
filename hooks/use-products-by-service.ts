// hooks/use-products-by-service.ts

import { useState, useEffect } from 'react';
import { getProductsByService } from '@/actions/products/get-by-service';

// ✅ Define the actual shape of data returned by getProductsByService
interface ProductBasic {
  id: string;
  name: string;
  code: string;
  description: string | null;
}

interface UseProductsByServiceResult {
  products: ProductBasic[]; // ✅ Use the correct type
  isLoading: boolean;
  error: Error | null;
  mutate: () => Promise<void>;
}

export function useProductsByService(serviceId?: string): UseProductsByServiceResult {
  const [products, setProducts] = useState<ProductBasic[]>([]);
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
      // ✅ FIX: Pass serviceId directly as a string
      const data = await getProductsByService(serviceId);
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