// /lib/types/product-types.ts

// Uvozimo Product model iz Prisma klijenta
import { Product } from '@prisma/client';

// Tip koji proširuje Prisma Product model
export interface ProductWithDetails extends Product {
    _count?: {
        // Brojači za relacije koje postoje u vašoj schema.prisma Product modelu
        complaints?: number; // Relacija Complaint[]
    };
    // Relacija 'services' NE postoji direktno na Product modelu u vašoj šemi
}

// Tip za opcije filtera za proizvode
// Usklađen sa poljima u vašoj schema.prisma Product modelu i query parametrima
export interface ProductFilterOptions {
    search?: string; // Pretraga po imenu, šifri (code), opisu
    isActive?: boolean; // Filtriranje po statusu aktivnost
    // serviceId filter NE postoji jer Product model u vašoj šemi nema direktnu relaciju ka Service modelu
    // Dodajte druge opcije filtera ako se pojave nova polja u Product modelu
}

// Tip za odgovor API rute koja vraća listu proizvoda sa totalCount
export interface ProductsApiResponse {
    products: ProductWithDetails[];
    totalCount: number;
}

// ProductFormData se importuje direktno iz schemas/product.ts
// export type ProductFormData = z.infer<typeof productSchema>;