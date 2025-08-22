// /components/products/ProductCard.tsx
'use client';

import Link from 'next/link';
// Uvozimo UI komponente iz Shadcn UI
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"; // Removed CardFooter
import { Badge } from "@/components/ui/badge";
// Uvozimo AŽURIRANI tip za Proizvod
import { ProductWithDetails } from '@/lib/types/product-types';


interface ProductCardProps {
    // Prima AŽURIRANI tip Proizvoda
    product: ProductWithDetails;
}

/**
 * Komponenta za prikaz kartice sa sažetkom informacija o proizvodu.
 * Usklađena sa Product modelom u schema.prisma i ažuriranim tipovima.
 * @param product - Objekat proizvoda koji treba prikazati.
 */
export function ProductCard({ product }: ProductCardProps) {

    return (
        // Omotajte karticu Linkom ka stranici sa detaljima proizvoda
        <Link href={`/products/${product.id}`} passHref>
            <Card className="h-full flex flex-col hover:shadow-lg transition-shadow cursor-pointer" as="article">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    {/* Naslov kartice je ime proizvoda */}
                    <CardTitle className="text-lg font-medium">
                         {product.name}
                    </CardTitle>
                    {/* Prikaz statusa kao bedž */}
                    <Badge variant={product.isActive ? 'default' : 'secondary'}>
                        {product.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                </CardHeader>
                <CardContent className="flex flex-col flex-grow">
                    {/* Prikaz šifre (Code) proizvoda */}
                    <CardDescription className="mb-2">
                         Code: <span className="font-medium text-foreground">{product.code}</span> {/* Prikazuje 'code' */}
                     </CardDescription>
                    {/* Prikaz skraćenog opisa */}
                     {product.description && (
                          <p className="text-sm text-muted-foreground flex-grow overflow-hidden text-ellipsis">
                              {product.description.substring(0, 100)}{product.description.length > 100 ? '...' : ''}
                          </p>
                     )}

                    {/* Polja price, sku, weight, dimensions, notes su UKLONJENA iz prikaza kartice */}

                    {/* Prikaz brojača relacija (Complaint) */}
                     {product._count && product._count.complaints !== undefined && (
                         <div className="text-xs text-muted-foreground mt-auto pt-2"> {/* mt-auto gura na dno */}
                             Complaints: {product._count.complaints}
                         </div>
                     )}

                </CardContent>
                 {/* CardFooter se može dodati ako su potrebne dodatne akcije direktno na kartici */}
            </Card>
        </Link>
    );
}