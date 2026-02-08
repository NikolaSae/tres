
// components/products/ProductDetails.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProductDetails({ product }: { product: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{product?.name || "Product Details"}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Product details will be displayed here.</p>
      </CardContent>
    </Card>
  );
}