// /components/providers/ProviderForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { createProvider } from "@/actions/providers/create";
import { updateProvider } from "@/actions/providers/update";

import { providerSchema, ProviderFormData } from "@/schemas/provider";


import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";


interface ProviderFormProps {
    provider?: {
        id: string;
        name: string;
        contactName: string | null;
        email: string | null;
        phone: string | null;
        address: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        imageUrl?: string | null; // Ensure imageUrl is included in the type
    };
}

export function ProviderForm({ provider }: ProviderFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const isEditing = !!provider;

    const form = useForm<ProviderFormData>({
        resolver: zodResolver(providerSchema),
        defaultValues: isEditing && provider
            ? {
                name: provider.name,
                contactName: provider.contactName ?? '',
                email: provider.email ?? '',
                phone: provider.phone ?? '',
                address: provider.address ?? '',
                isActive: provider.isActive,
                imageUrl: provider.imageUrl ?? '', // Set initial value for imageUrl
            }
            : {
                isActive: true,
                name: '',
                contactName: '',
                email: '',
                phone: '',
                address: '',
                imageUrl: '', // Default empty string for new provider
            },
          mode: 'onSubmit',
    });

     useEffect(() => {
         if (provider) {
             form.reset({
                    name: provider.name || '',
                    contactName: provider.contactName ?? '',
                    email: provider.email ?? '',
                    phone: provider.phone ?? '',
                    address: provider.address ?? '',
                    isActive: provider.isActive ?? true,
                    imageUrl: provider.imageUrl ?? '', // Reset imageUrl
              });
         } else {
             form.reset({
                 name: '',
                 contactName: '',
                 email: '',
                 phone: '',
                 address: '',
                 isActive: true,
                 imageUrl: '', // Reset imageUrl
             });
         }
     }, [provider, form]);


    const onSubmit = async (data: ProviderFormData) => {
        setIsLoading(true);

        let result;
        if (isEditing && provider) {
            result = await updateProvider(provider.id, data);
        } else {
            result = await createProvider(data);
        }

        setIsLoading(false);

        if (result?.success) {
            toast.success(result.success); // Use toast.success directly
            const newItemId = isEditing ? provider?.id : result.id;
            if (newItemId) {
                router.push(`/providers/${newItemId}`);
            } else {
                router.push('/providers');
            }
            router.refresh();

        } else {
            console.error("Failed to save provider:", result?.error);
            toast.error(result?.error || 'An unknown error occurred.'); // Use toast.error directly
        }
    };


    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>{isEditing ? "Edit Provider" : "Create New Provider"}</CardTitle>
                 <p className="text-sm text-muted-foreground">
                     {isEditing ? `Edit details for provider: ${provider?.name}` : 'Fill in the details for a new provider.'}
                 </p>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                        {/* Polje: Name */}
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Provider Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter provider name" {...field} disabled={isLoading} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                         {/* Polje: Contact Name */}
                         <FormField
                             control={form.control}
                             name="contactName"
                             render={({ field }) => (
                                 <FormItem>
                                     <FormLabel>Contact Name (Optional)</FormLabel>
                                     <FormControl>
                                         <Input placeholder="Enter contact name" {...field} disabled={isLoading} />
                                     </FormControl>
                                     <FormMessage />
                                 </FormItem>
                             )}
                         />

                         {/* Polje: Email */}
                         <FormField
                             control={form.control}
                             name="email"
                             render={({ field }) => (
                                 <FormItem>
                                     <FormLabel>Email (Optional)</FormLabel>
                                     <FormControl>
                                         <Input type="email" placeholder="Enter email" {...field} disabled={isLoading} />
                                     </FormControl>
                                     <FormMessage />
                                 </FormItem>
                             )}
                         />

                         {/* Polje: Phone */}
                         <FormField
                             control={form.control}
                             name="phone"
                             render={({ field }) => (
                                 <FormItem>
                                     <FormLabel>Phone (Optional)</FormLabel>
                                     <FormControl>
                                         <Input type="tel" placeholder="Enter phone number" {...field} disabled={isLoading} />
                                     </FormControl>
                                     <FormMessage />
                                 </FormItem>
                             )}
                         />

                         {/* Polje: Address */}
                         <FormField
                             control={form.control}
                             name="address"
                             render={({ field }) => (
                                 <FormItem>
                                     <FormLabel>Address (Optional)</FormLabel>
                                     <FormControl>
                                         <Textarea placeholder="Enter address" {...field} disabled={isLoading} rows={3} />
                                     </FormControl>
                                     <FormMessage />
                                 </FormItem>
                             )}
                         />

                         {/* Polje: Image URL */}
                         <FormField
                             control={form.control}
                             name="imageUrl"
                             render={({ field }) => (
                                 <FormItem>
                                     <FormLabel>Image URL (Optional)</FormLabel>
                                     <FormControl>
                                         {/* Input field for the image URL */}
                                         <Input
                                             placeholder="Enter image URL"
                                             {...field}
                                             disabled={isLoading}
                                             // Ensure value is always a string for the input
                                             value={field.value || ''}
                                         />
                                     </FormControl>
                                     <FormMessage />
                                 </FormItem>
                             )}
                         />


                         {/* Polje: isActive (Checkbox) */}
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


                        {/* Dugmad za akciju */}
                        <div className="flex justify-end space-x-4">
                             <Button
                                 type="button"
                                 variant="outline"
                                 onClick={() => router.back()}
                                 disabled={isLoading}
                             >
                                 Cancel
                             </Button>
                             <Button
                                 type="submit"
                                 disabled={isLoading}
                             >
                                 {isLoading ? "Saving..." : isEditing ? "Update Provider" : "Create Provider"}
                             </Button>
                        </div>
                    </form>
                </Form>
             </CardContent>
              {isEditing && provider && (
                  <CardFooter className="text-xs text-muted-foreground">
                      Created: {new Date(provider.createdAt).toLocaleString()} | Last Updated: {new Date(provider.updatedAt).toLocaleString()}
                 </CardFooter>
              )}
        </Card>
    );
}
