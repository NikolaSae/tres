// components/products/ProductForm.tsx - ISPRAVLJEN
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema, ProductFormData } from '@/schemas/product';
import { createProduct } from '@/lib/actions/products';
import { updateProduct } from '@/lib/actions/products';
import { ProductWithDetails } from '@/lib/types/product-types';
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
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface ProductFormProps {
    initialData?: ProductWithDetails | null;
    productId?: string;
}

export function ProductForm({ initialData, productId }: ProductFormProps) {
    const router = useRouter();
    const { toast } = useToast();

    const form = useForm<ProductFormData>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: initialData?.name || '',
            code: initialData?.code || '',
            description: initialData?.description || '',
            isActive: initialData?.isActive ?? true,
        },
    });

    const [isLoading, setIsLoading] = useState(false);

    const onSubmit = async (values: ProductFormData) => {
        setIsLoading(true);
        let result;

        if (productId) {
            result = await updateProduct(productId, values);
        } else {
            result = await createProduct(values);
        }

        setIsLoading(false);

        if (result?.success) {
            toast({
                title: 'Success!',
                description: result.success,
            });
            router.push(`/products/${result.id || productId}`);
            router.refresh();
        } else if (result?.error) {
            toast({
                title: 'Error',
                description: result.error,
                variant: 'destructive',
            });
            // ✅ ISPRAVLJENA GREŠKA: Uklonjen pristup nepostojećem 'details' property
        }
    };

    return (
        <Card>
             <CardHeader>
                 <CardTitle>{productId ? 'Edit Product' : 'Create Product'}</CardTitle>
                 <p className="text-sm text-muted-foreground">
                     {productId ? `Edit details for product ID: ${productId}` : 'Fill in the details for a new product.'}
                 </p>
             </CardHeader>
             <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="name"
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

                         <FormField
                            control={form.control}
                            name="code"
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

                        <FormField
                            control={form.control}
                            name="description"
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

                        <FormField
                            control={form.control}
                            name="isActive"
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

                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (productId ? 'Saving...' : 'Creating...') : (productId ? 'Save Changes' : 'Create Product')}
                        </Button>
                    </form>
                </Form>
             </CardContent>
        </Card>
    );
}