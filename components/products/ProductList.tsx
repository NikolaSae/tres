// components/products/ProductList.tsx
'use client';

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProducts } from "@/hooks/use-products";
import { ProductWithDetails, ProductFilterOptions } from "@/lib/types/product-types";
import { ProductFilters } from "@/components/products/ProductFilters";
import { deleteProduct } from "@/actions/products/delete";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const ITEMS_PER_PAGE = 10;

export function ProductList() {
    const router = useRouter();

    const {
        products,
        totalCount,
        loading,
        error,
        filters,
        pagination,
        setFilters,
        setPagination,
        refresh,
    } = useProducts(
        {},
        { page: 1, limit: ITEMS_PER_PAGE }
    );

    const [isDeleting, setIsDeleting] = useState(false);
    const [productToDeleteId, setProductToDeleteId] = useState<string | null>(null);

    const handleFilterChange = useCallback((filterOptions: ProductFilterOptions) => {
        setFilters(filterOptions as any);
    }, [setFilters]);

    const handlePageChange = useCallback((page: number) => {
        setPagination({ page, limit: ITEMS_PER_PAGE });
    }, [setPagination]);

    const handleDeleteClick = useCallback((productId: string) => {
        setProductToDeleteId(productId);
    }, []);

    const handleConfirmDelete = useCallback(async () => {
        if (!productToDeleteId) return;

        setIsDeleting(true);
        const result = await deleteProduct(productToDeleteId);
        setIsDeleting(false);
        setProductToDeleteId(null);

        if (result?.success) {
            toast.success(result.success);
            refresh();
        } else if (result?.error) {
            toast.error(result.error);
        }
    }, [productToDeleteId, refresh]);

    const pageCount = Math.ceil(totalCount / ITEMS_PER_PAGE);

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="w-full h-10" />
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Code</TableHead>
                                <TableHead>Active</TableHead>
                                <TableHead>Complaints</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-[60px]" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-[50px]" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-5 w-[120px]" /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        );
    }

    if (error) {
        return <div className="text-center py-4 text-red-500">Error loading products: {error.message}</div>;
    }

    return (
        <div className="space-y-4">
            <ProductFilters onFilterChange={handleFilterChange} initialFilters={filters} />

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead>Active</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Complaints</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                                    No products found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.map((product) => {
                                return (
                                    <TableRow key={product.id}>
                                        <TableCell className="font-medium">
                                            <Link
                                                href={`/products/${product.id}`}
                                                className="text-blue-600 hover:text-blue-800 hover:underline"
                                            >
                                                {product.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell>{product.code}</TableCell>
                                        <TableCell>{product.isActive ? 'Yes' : 'No'}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {product.description ? `${product.description.substring(0, 50)}${product.description.length > 50 ? '...' : ''}` : 'N/A'}
                                        </TableCell>
                                        <TableCell>{product._count?.complaints ?? 0}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => router.push(`/products/${product.id}`)}
                                                >
                                                    View
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => router.push(`/products/${product.id}/edit`)}
                                                >
                                                    Edit
                                                </Button>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleDeleteClick(product.id)}
                                                        disabled={isDeleting}
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

            {pageCount > 1 && (
                <Pagination>
                    <PaginationContent>
                        <PaginationPrevious
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                if (pagination.page > 1) {
                                    handlePageChange(pagination.page - 1);
                                }
                            }}
                            className={pagination.page <= 1 ? 'pointer-events-none opacity-50' : undefined}
                        />
                        {Array.from({ length: pageCount }).map((_, i) => {
                            const page = i + 1;
                            return (
                                <PaginationItem key={page}>
                                    <PaginationLink
                                        href="#"
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
                        <PaginationNext
                            href="#"
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

            <AlertDialog open={productToDeleteId !== null} onOpenChange={(open) => !open && setProductToDeleteId(null)}>
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