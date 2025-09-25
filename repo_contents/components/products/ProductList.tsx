// /components/products/ProductList.tsx
'use client';

import { useState, useCallback } from "react"; // useState za delete modal
import Link from "next/link";
import { useRouter } from "next/navigation";
// Uvozimo AŽURIRANI hook za dohvatanje proizvoda
import { useProducts } from "@/hooks/use-products"; // useProducts koristi getProducts akciju
// Uvozimo AŽURIRANI tip za Proizvod
import { ProductWithDetails, ProductFilterOptions } from "@/lib/types/product-types";
// Uvozimo komponentu filtera (AŽURIRANU)
import { ProductFilters } from "@/components/products/ProductFilters"; // Komponenta koju smo generisali/ažurirali
// Uvozimo AŽURIRANU server akciju za brisanje proizvoda
import { deleteProduct } from "@/actions/products/delete";
// Uvozimo UI komponente iz Shadcn UI
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"; // Za paginaciju
import { Skeleton } from "@/components/ui/skeleton"; // Za loading state
import { toast } from "sonner";
// Uvozimo AlertDialog za potvrdu brisanja
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


// Definisanje opcija paginacije
const ITEMS_PER_PAGE = 10; // Prilagodite broj stavki po stranici

/**
 * Component for listing products in a table with filters and pagination.
 * Uses useProducts hook for data fetching.
 * Integrates ProductFilters and pagination controls.
 * Usklađena sa Product modelom u schema.prisma.
 */
export function ProductList() {
    const router = useRouter();
    // const { toast } = useToast();

    // Korišćenje AŽURIRANOG hooka useProducts
    const {
        products,
        totalCount,
        loading,
        error,
        filters, // Trenutni filteri iz hooka
        pagination, // Trenutna paginacija iz hooka
        setFilters, // Funkcija za promenu filtera
        setPagination, // Funkcija za promenu paginacije
        refresh, // Funkcija za ručno osvežavanje liste
    } = useProducts(
        {}, // Početni filteri (prazno)
        { page: 1, limit: ITEMS_PER_PAGE } // Početna paginacija
    );

     // State za brisanje
     const [isDeleting, setIsDeleting] = useState(false); // Status brisanja
     const [productToDeleteId, setProductToDeleteId] = useState<string | null>(null); // ID proizvoda za brisanje

    // Rukovalac promene filtera (prima AŽURIRANE filter opcije)
    const handleFilterChange = useCallback((filterOptions: ProductFilterOptions) => {
        setFilters(filterOptions); // Poziva setFilters iz useProducts hooka
        // Paginacija se automatski resetuje na stranu 1 unutar useProducts hooka kada se filteri promene
    }, [setFilters]);

    // Rukovalac promene stranice
    const handlePageChange = useCallback((page: number) => {
        setPagination({ page, limit: ITEMS_PER_PAGE }); // Poziva setPagination iz hooka
    }, [setPagination]);

     // Rukovalac iniciranja brisanja (otvara AlertDialog)
     const handleDeleteClick = useCallback((productId: string) => {
         setProductToDeleteId(productId);
     }, []);

     // Rukovalac potvrde brisanja
     const handleConfirmDelete = useCallback(async () => {
         if (!productToDeleteId) return;

         setIsDeleting(true);
         // Pozivanje AŽURIRANE Server Akcije za brisanje proizvoda
         const result = await deleteProduct(productToDeleteId); // Action deleteProduct je ažurirana
         setIsDeleting(false);
         setProductToDeleteId(null); // Zatvara AlertDialog

         if (result?.success) {
             toast({ title: 'Success!', description: result.success });
             refresh(); // Osvežava listu nakon brisanja
         } else if (result?.error) {
             toast({ title: 'Error', description: result.error, variant: 'destructive' });
         }
     }, [productToDeleteId, refresh, toast]);


    // Izračunavanje ukupnog broja stranica
    const pageCount = Math.ceil(totalCount / ITEMS_PER_PAGE);


    // Prikaz stanja učitavanja (Skeleton Table)
    if (loading) {
         return (
             <div className="space-y-4">
                  {/* Prikaži Skeleton za filtere */}
                 <Skeleton className="w-full h-10" /> {/* Prilagodite dimenzije */}
                  {/* Prikaži Skeleton za tabelu */}
                 <div className="rounded-md border">
                     <Table>
                         <TableHeader>
                             <TableRow>
                                 <TableHead>Name</TableHead>
                                 <TableHead>Code</TableHead> {/* Ažurirano polje */}
                                 <TableHead>Active</TableHead>
                                 <TableHead>Complaints</TableHead> {/* Brojač relacije */}
                                 <TableHead className="text-right">Actions</TableHead>
                             </TableRow>
                         </TableHeader>
                         <TableBody>
                             {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                                 <TableRow key={i}>
                                     <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                                     <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell> {/* Skeleton za code */}
                                     <TableCell><Skeleton className="h-5 w-[60px]" /></TableCell>
                                     <TableCell><Skeleton className="h-5 w-[50px]" /></TableCell> {/* Skeleton za brojač */}
                                     <TableCell className="text-right"><Skeleton className="h-5 w-[120px]" /></TableCell>
                                 </TableRow>
                             ))}
                         </TableBody>
                     </Table>
                 </div>
             </div>
         );
    }


    // Prikaz greške
    if (error) {
        return <div className="text-center py-4 text-red-500">Error loading products: {error.message}</div>;
    }


    return (
        <div className="space-y-4">
            {/* Renderovanje komponente filtera i prosleđivanje rukovaoca */}
             {/* ProductFilters komponenta je ažurirana i rukuje search i isActive */}
            <ProductFilters onFilterChange={handleFilterChange} initialFilters={filters} />

            <div className="rounded-md border">
                {/* Tabela za prikaz liste proizvoda */}
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Code</TableHead> {/* AŽURIRANA kolona - prikazuje Code umesto SKU/Price */}
                            <TableHead>Active</TableHead>
                            <TableHead>Description</TableHead> {/* Dodato Display Description */}
                            <TableHead>Complaints</TableHead> {/* Brojač relacije */}
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {/* Provera da li ima proizvoda za prikaz */}
                        {products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-4 text-muted-foreground"> {/* Colspan prilagodite broju kolona */}
                                    No products found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            // Mapiranje liste proizvoda i renderovanje redova tabele
                            products.map((product) => {
                                return (
                                    <TableRow key={product.id}>
                                        {/* Prikaz polja iz AŽURIRANOG Product modela */}
                                        <TableCell className="font-medium">
                                             {/* Link ka stranici sa detaljima proizvoda */}
                                            <Link
                                                href={`/products/${product.id}`}
                                                className="text-blue-600 hover:text-blue-800 hover:underline"
                                            >
                                                {product.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell>{product.code}</TableCell> {/* AŽURIRANO - prikazuje Code */}
                                        <TableCell>{product.isActive ? 'Yes' : 'No'}</TableCell>
                                         <TableCell className="text-muted-foreground text-sm">
                                             {/* Prikaz opisa, skraćenog ako je dug */}
                                            {product.description ? `${product.description.substring(0, 50)}${product.description.length > 50 ? '...' : ''}` : 'N/A'}
                                         </TableCell>
                                        <TableCell>{product._count?.complaints ?? 0}</TableCell> {/* Brojač relacije Complaint */}

                                        {/* Polja price, sku, weight, dimensions, notes su UKLONJENA iz prikaza liste */}

                                        {/* Kolona za akcije (View, Edit, Delete) */}
                                        <TableCell className="text-right">
                                            <div className="flex justify-end space-x-2">
                                                 {/* Dugme View - navigacija na stranicu detalja */}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => router.push(`/products/${product.id}`)}
                                                >
                                                    View
                                                </Button>
                                                {/* Dugme Edit - navigacija na stranicu za izmenu */}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => router.push(`/products/${product.id}/edit`)}
                                                >
                                                    Edit
                                                </Button>
                                                {/* Dugme Delete - otvara AlertDialog za potvrdu */}
                                                 <AlertDialogTrigger asChild>
                                                     <Button
                                                         variant="destructive"
                                                         size="sm"
                                                         onClick={() => handleDeleteClick(product.id)} // Postavlja ID proizvoda za brisanje
                                                         disabled={isDeleting} // Onemogući dugme dok se briše
                                                     >
                                                         Delete
                                                     </Button>
                                                 </AlertDialogTrigger>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Kontrole za paginaciju */}
            {pageCount > 1 && (
                <Pagination>
                    <PaginationContent>
                        {/* Dugme za prethodnu stranicu */}
                        <PaginationPrevious
                            href="#" // Placeholder, navigacija se rešava onClick
                            onClick={(e) => {
                                e.preventDefault();
                                if (pagination.page > 1) {
                                    handlePageChange(pagination.page - 1);
                                }
                            }}
                            className={pagination.page <= 1 ? 'pointer-events-none opacity-50' : undefined}
                        />
                        {/* Prikaz brojeva stranica (pojednostavljeno) */}
                        {/* Možete dodati složeniju logiku za prikaz raspona stranica */}
                         {Array.from({ length: pageCount }).map((_, i) => {
                              const page = i + 1;
                              return (
                                   <PaginationItem key={page}>
                                        <PaginationLink
                                             href="#" // Placeholder
                                             onClick={(e) => {
                                                 e.preventDefault();
                                                 handlePageChange(page);
                                             }}
                                             isActive={pagination.page === page}
                                        >
                                             {page}
                                        </PaginationLink>
                                   </PaginationItem>
                              );
                         })}
                         {/* Dodajte PaginationEllipsis ako je potreban za veliki broj stranica */}

                        {/* Dugme za sledeću stranicu */}
                        <PaginationNext
                             href="#" // Placeholder
                             onClick={(e) => {
                                e.preventDefault();
                                if (pagination.page < pageCount) {
                                    handlePageChange(pagination.page + 1);
                                }
                            }}
                            className={pagination.page >= pageCount ? 'pointer-events-none opacity-50' : undefined}
                        />
                    </PaginationContent>
                </Pagination>
            )}

            {/* AlertDialog za potvrdu brisanja - izvan glavne strukture prikaza tabele */}
             <AlertDialog open={productToDeleteId !== null} onOpenChange={(open) => !open && setProductToDeleteId(null)}>
                 {/* AlertDialogTrigger je već unutar TableCell */}
                 <AlertDialogContent>
                     <AlertDialogHeader>
                         <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                         <AlertDialogDescription>
                             This action cannot be undone. This will permanently delete the product.
                             Ensure there are no associated records (like complaints) that prevent deletion.
                         </AlertDialogDescription>
                     </AlertDialogHeader>
                     <AlertDialogFooter>
                         <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                         <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting}>
                             {isDeleting ? 'Deleting...' : 'Delete'}
                         </AlertDialogAction>
                     </AlertDialogFooter>
                 </AlertDialogContent>
             </AlertDialog>

        </div>
    );
}
