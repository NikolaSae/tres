// components/complaints/ProductSelection.tsx


"use client";

import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormControl } from '@/components/ui/form';
import { getProductsByServiceId } from "@/actions/complaints/products";
import { Product } from '@prisma/client';

interface ProductSelectionProps {
  serviceId: string | null | undefined;
  selectedProductId: string;
  onProductSelect: (productId: string) => void;
}

export function ProductSelection({ serviceId, selectedProductId, onProductSelect }: ProductSelectionProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!serviceId) {
      setProducts([]);
      // onProductSelect(''); // Optional: uncomment to reset form value
      return;
    }

    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedProducts = await getProductsByServiceId(serviceId);
        setProducts(fetchedProducts as Product[]);
      } catch (err: any) {
        console.error("Error fetching products:", err);
        setError("Failed to load products");
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();

  }, [serviceId, onProductSelect]);

   useEffect(() => {
       if (selectedProductId && products.length > 0 && !products.find(p => p.id === selectedProductId)) {
           onProductSelect('');
       }
   }, [products, selectedProductId, onProductSelect]);


  return (
    <Select
      value={selectedProductId}
      onValueChange={onProductSelect}
      disabled={!serviceId || isLoading}
    >
      <SelectTrigger>
        <SelectValue placeholder={isLoading ? "Loading products..." : (serviceId ? "Select product" : "Select a service first")} />
      </SelectTrigger>
      <SelectContent>
         {error && <SelectItem value="" disabled>{error}</SelectItem>}
         {!isLoading && !error && products.length === 0 && serviceId && (
             <SelectItem value="" disabled>No products found for this service</SelectItem>
         )}
         {!isLoading && !error && products.map(product => (
             <SelectItem key={product.id} value={product.id}>
                 {product.name}
             </SelectItem>
         ))}
      </SelectContent>
    </Select>
  );
}