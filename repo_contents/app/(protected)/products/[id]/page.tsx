// /app/(protected)/products/[id]/page.tsx

import { Metadata } from "next";
// Uvozimo AŽURIRANU ProductDetails komponentu
import { ProductDetails } from "@/components/products/ProductDetails"; // Ova komponenta je ažurirana
// Uvozimo AŽURIRANU Server Akciju za dohvatanje pojedinačnog proizvoda
import { getProductById } from '@/actions/products/get';


interface ProductDetailsPageProps {
    params: {
        id: string; // ID proizvoda iz URL-a
    };
}

// Dinamička generacija metapodataka
export async function generateMetadata(
    { params }: ProductDetailsPageProps,
): Promise<Metadata> {
    // Dohvatanje proizvoda za naslov (može biti null ako nije pronađen)
    const result = await getProductById(params.id);
    const product = result.data;

    return {
        title: product ? `${product.name} Details | Management Dashboard` : "Product Details | Management Dashboard",
        description: product ? `Details for product: ${product.name} (Code: ${product.code})` : "Product details page.",
    };
}


// Stranica za prikaz detalja pojedinačnog proizvoda
// Ovo je Server Komponenta
export default async function ProductDetailsPage({ params }: ProductDetailsPageProps) {

    const { id } = params; // Dohvatamo ID iz URL-a

    // Dohvatanje podataka o proizvodu sa Servera koristeći AŽURIRANU akciju
    const result = await getProductById(id); // Akcija getProductById je ažurirana

    // Provera da li je došlo do greške ili proizvod nije pronađen
    if (result.error || !result.data) {
         // Renderujte poruku o grešci ili 404 stranicu
         return (
             <div className="p-6 text-center text-red-500">
                 {result.error || "Product not found."}
             </div>
         );
    }

    const product = result.data; // Proizvod je pronađen i dohvaćen


    // Renderujemo AŽURIRANU ProductDetails komponentu, prosleđujući ID proizvoda
    {/* ProductDetails komponenta sada koristi useProduct hook */}
    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    {/* Naslov */}
                    <h1 className="text-2xl font-bold tracking-tight">Product Details</h1>
                    <p className="text-gray-500">
                       Details for product: <span className="font-medium">{product.name}</span>
                    </p>
                </div>
                 {/* Opciono: Link ili dugme za povratak na listu */}
                  {/* <Link href={`/products`}>
                      <Button variant="outline">Back to Products List</Button>
                  </Link> */}
                  {/* Opciono: Link ili dugme za izmenu */}
                   {/* <Link href={`/products/${product.id}/edit`}>
                       <Button>Edit Product</Button>
                   </Link> */}
            </div>

            {/* Renderujemo AŽURIRANU ProductDetails komponentu */}
            {/* Komponenta dohvaća svoje podatke klijentski koristeći useProduct hook */}
            <ProductDetails productId={id} />

        </div>
    );
}