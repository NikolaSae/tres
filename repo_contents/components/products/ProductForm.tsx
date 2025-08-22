// /components/products/ProductForm.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Uvozimo AŽURIRANU Zod šemu i tip za podatke proizvoda
import { productSchema, ProductFormData } from '@/schemas/product';
// Uvozimo AŽURIRANE Server Akcije za kreiranje i ažuriranje proizvoda
import { createProduct } from '@/actions/products/create';
import { updateProduct } from '@/actions/products/update';
// Uvozimo tip za Proizvod sa detaljima (ako je potreban za initialData)
import { ProductWithDetails } from '@/lib/types/product-types';

// Uvozimo UI komponente iz Shadcn UI
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';


interface ProductFormProps {
    // Ako se forma koristi za izmenu, prosleđuju se inicijalni podaci i ID
    initialData?: ProductWithDetails | null;
    productId?: string;
}

/**
 * Reusable form component for creating or editing a product.
 * Uses react-hook-form and zod for validation.
 * Calls createProduct or updateProduct server actions.
 * Usklađen sa Product modelom u schema.prisma i ažuriranim productSchema.
 */
export function ProductForm({ initialData, productId }: ProductFormProps) {
    const router = useRouter();
    const { toast } = useToast();

    // Definisanje forme sa zodResolver-om i ažuriranom šemom
    const form = useForm<ProductFormData>({
        resolver: zodResolver(productSchema), // Koristimo ažuriranu productSchema
        defaultValues: {
            // Postavljamo podrazumevane vrednosti na osnovu initialData ili praznih stringova/default vrednosti
            name: initialData?.name || '',
            code: initialData?.code || '', // Uključujemo 'code'
            description: initialData?.description || '',
            isActive: initialData?.isActive ?? true, // Ako initialData nema isActive, podrazumevano je true
            // price, sku, weight, dimensions, notes - Ovi fajlovi NE postoje u Product modelu u schema.prisma,
            // stoga ih NE Uključujemo u formu i defaultValues.
        },
    });

    // State za praćenje statusa slanja forme
    const [isLoading, setIsLoading] = useState(false);

    // Rukovalac slanja forme
    const onSubmit = async (values: ProductFormData) => {
        setIsLoading(true);
        let result;

        if (productId) {
            // Forma za izmenu: pozivamo updateProduct Server Akciju
             // Action updateProduct je ažurirana i očekuje ID i values
            result = await updateProduct(productId, values);
        } else {
            // Forma za kreiranje: pozivamo createProduct Server Akciju
             // Action createProduct je ažurirana i očekuje values
            result = await createProduct(values);
        }

        setIsLoading(false);

        // Prikazivanje toast notifikacije
        if (result?.success) {
            toast({
                title: 'Success!',
                description: result.success,
            });
            // Preusmeravanje nakon uspeha (npr. na stranicu liste ili detalja)
            router.push(`/products/${result.id || productId}`); // Koristimo id iz rezultata ili productId ako je bio edit
            router.refresh(); // Osvežavanje rute da bi se podaci ponovo dohvatili
        } else if (result?.error) {
            toast({
                title: 'Error',
                description: result.error,
                variant: 'destructive',
            });
            // Opciono: prikaži detalje greške iz Zod validacije ako ih akcija vrati
            if (result.details) {
                console.error('Validation details:', result.details);
                // Možete setovati greške na form fields koristeći form.setError
            }
        }
    };


    return (
        <Card>
             <CardHeader>
                 {/* Naslov zavisi da li se radi o kreiranju ili izmeni */}
                 <CardTitle>{productId ? 'Edit Product' : 'Create Product'}</CardTitle>
                 <p className="text-sm text-muted-foreground">
                     {productId ? `Edit details for product ID: ${productId}` : 'Fill in the details for a new product.'}
                 </p>
             </CardHeader>
             <CardContent>
                {/* Omotajte formu Shadcn Form kontextom */}
                <Form {...form}>
                    {/* Definisanje HTML forme */}
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                        {/* Polje: Name */}
                        <FormField
                            control={form.control}
                            name="name" // Usklađeno sa productSchema
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Product Name" {...field} disabled={isLoading} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Polje: Code (Novo polje iz schema.prisma) */}
                         <FormField
                            control={form.control}
                            name="code" // Usklađeno sa productSchema
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Code</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Product Code" {...field} disabled={isLoading} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />


                        {/* Polje: Description (Textarea) */}
                        <FormField
                            control={form.control}
                            name="description" // Usklađeno sa productSchema
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Product description..."
                                            {...field}
                                            disabled={isLoading}
                                            rows={4}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Polje: isActive (Checkbox) */}
                        <FormField
                            control={form.control}
                            name="isActive" // Usklađeno sa productSchema
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>
                                            Is Active
                                        </FormLabel>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Polja price, sku, weight, dimensions, notes su UKLONJENA jer NISU u schema.prisma Product modelu */}
                         {/* <FormField ... name="price" ... /> */}
                         {/* <FormField ... name="sku" ... /> */}
                         {/* ... */}


                        {/* Dugme za slanje forme */}
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (productId ? 'Saving...' : 'Creating...') : (productId ? 'Save Changes' : 'Create Product')}
                        </Button>

                         {/* Opciono dugme za resetovanje forme */}
                          {/* <Button
                              type="button"
                              variant="outline"
                              onClick={() => form.reset()}
                              disabled={isLoading}
                              className="ml-2"
                          >
                              Reset
                          </Button> */}

                    </form>
                </Form>
             </CardContent>
             {/* Opciono: CardFooter za dodatne akcije */}
              {/* <CardFooter>
                  <p className="text-xs text-muted-foreground">Last updated: {initialData?.updatedAt ? new Date(initialData.updatedAt).toLocaleString() : 'N/A'}</p>
             </CardFooter> */}
        </Card>
    );
}