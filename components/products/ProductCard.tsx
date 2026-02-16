// components/products/ProductCard.tsx
'use client';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductWithDetails } from '@/lib/types/product-types';

interface ProductCardProps {
    product: ProductWithDetails;
}

export function ProductCard({ product }: ProductCardProps) {
    return (
        <Link href={`/products/${product.id}`} passHref>
            <Card className="h-full flex flex-col hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-medium">
                         {product.name}
                    </CardTitle>
                    <Badge variant={product.isActive ? 'default' : 'secondary'}>
                        {product.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                </CardHeader>
                <CardContent className="flex flex-col flex-grow">
                    <CardDescription className="mb-2">
                         Code: <span className="font-medium text-foreground">{product.code}</span>
                     </CardDescription>
                     {product.description && (
                          <p className="text-sm text-muted-foreground flex-grow overflow-hidden text-ellipsis">
                              {product.description.substring(0, 100)}{product.description.length > 100 ? '...' : ''}
                          </p>
                     )}
                     {product._count && product._count.complaints !== undefined && (
                         <div className="text-xs text-muted-foreground mt-auto pt-2">
                             Complaints: {product._count.complaints}
                         </div>
                     )}
                </CardContent>
            </Card>
        </Link>
    );
}