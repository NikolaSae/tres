// /app/(protected)/products/page.tsx

import { Metadata } from "next";
import Link from "next/link";
// Uvozimo AŽURIRANU ProductList komponentu
import { ProductList } from "@/components/products/ProductList"; // Ova komponenta je ažurirana
// Uvozimo UI komponente
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react"; // Ikona

export const metadata: Metadata = {
  title: "Products List | Management Dashboard",
  description: "View and manage all products.",
};

// Stranica za prikaz liste svih proizvoda
// Ovo je Server Komponenta koja renderuje ProductList komponentu (Client Component)
export default function ProductsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-gray-500">
            Manage your organization's products.
          </p>
        </div>
        <div className="flex items-center gap-2">
             {/* Opciono: Dugme/Link za import stranicu proizvoda ako postoji */}
             {/* <Button variant="outline" asChild>
                <Link href="/products/import"> // Pretpostavljena ruta za import proizvoda
                     Import Products
                </Link>
             </Button> */}
            {/* Dugme/Link za stranicu za kreiranje novog proizvoda */}
             {/* Stranica /products/new je generisana/ažurirana */}
             <Button asChild>
                <Link href="/products/new"> {/* Link ka stranici za kreiranje */}
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create New Product
                </Link>
             </Button>
        </div>
      </div>

      {/* Renderujemo AŽURIRANU ProductList komponentu */}
      {/* ProductList unutar sebe dohvata podatke, rukuje filterima i paginacijom */}
      <ProductList />

    </div>
  );
}