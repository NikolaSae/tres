// /hooks/use-product.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
// Uvozimo ažurirani tip za Proizvod sa detaljima (usklađen sa schema.prisma)
import { ProductWithDetails } from '@/lib/types/product-types';
// Uvozimo server akciju za dohvatanje pojedinačnog proizvoda (AŽURIRANU)
import { getProductById } from '@/actions/products/get'; // Ova akcija je ažurirana u 5.3

interface UseProductResult {
  product: ProductWithDetails | null;
  loading: boolean;
  error: Error | null;
  // refresh: () => void; // Opciono: funkcija za osvežavanje podataka
}

/**
 * Hook za dohvatanje pojedinačnog proizvoda po ID-u.
 * Koristi AŽURIRANU Server Akciju actions/products/get.ts (getProductById).
 * Usklađen sa Product modelom u schema.prisma i ažuriranim tipovima.
 * @param productId - ID proizvoda koji se dohvaća. Može biti null ili undefined pre nego što je ID poznat.
 * @returns Objekat sa podacima o proizvodu, statusom učitavanja i greškom.
 */
export function useProduct(productId: string | null | undefined): UseProductResult {
    const [product, setProduct] = useState<ProductWithDetails | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Funkcija za dohvatanje podataka (nije memoizovana jer zavisi samo od productId)
    const fetchProduct = async (id: string) => {
        setLoading(true);
        setError(null);

        try {
            // Pozivanje AŽURIRANE Server Akcije za dohvatanje proizvoda po ID-u
            // Akcija getProductById sada vraća ProductWithDetails usklađen sa schema.prisma
            const result = await getProductById(id);

            if (result.error) {
                throw new Error(result.error);
            }

            setProduct(result.data); // result.data je ProductWithDetails | null

        } catch (err) {
            console.error(`Error fetching product with ID ${id}:`, err);
            setError(err instanceof Error ? err : new Error('Failed to fetch product details.'));
            setProduct(null); // Resetuj proizvod u slučaju greške
        } finally {
            setLoading(false);
        }
    };

    // Efekat za dohvatanje podataka kada se productId promeni ili pri montiranju (ako productId postoji)
    useEffect(() => {
        // Dohvati podatke samo ako imamo važeći productId
        if (productId) {
            fetchProduct(productId);
        } else {
             // Resetuj stanje ako nema productId (npr. na stranici za kreiranje)
             setProduct(null);
             setLoading(false);
             setError(null);
        }
        // Dependency array: productId osigurava da se fetch pokrene ponovo ako se ID promeni
        // fetchProduct se ne stavlja u dependency array jer nije memoizovana, a poziva se direktno
    }, [productId]); // Zavisnost je productId

     // Opciono: Funkcija za ručno osvežavanje
     // const refresh = useCallback(() => {
     //     if (productId) {
     //          fetchProduct(productId);
     //     }
     // }, [productId]);


    return {
        product, // Izlažemo podatke o proizvodu
        loading, // Izlažemo status učitavanja
        error, // Izlažemo grešku
        // refresh, // Izlažemo funkciju za osvežavanje
    };
}