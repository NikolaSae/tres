'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { serviceSchema, ServiceFormData } from '@/schemas/service';
import { createService } from '@/actions/services/create';
import { updateService } from '@/actions/services/update';
import { ServiceWithDetails } from '@/lib/types/service-types';
import { ServiceType } from '@prisma/client';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';

interface ServiceFormProps {
    initialData?: ServiceWithDetails | null;
    serviceId?: string;
}

export function ServiceForm({ initialData, serviceId }: ServiceFormProps) {
    const router = useRouter();

    const form = useForm<ServiceFormData>({
        resolver: zodResolver(serviceSchema),
        defaultValues: {
            name: initialData?.name || '',
            type: initialData?.type || undefined,
            description: initialData?.description || '',
            isActive: initialData?.isActive ?? true,
        },
    });

     useEffect(() => {
         if (initialData) {
              form.reset({
                   name: initialData.name || '',
                   type: initialData.type || undefined,
                   description: initialData.description || '',
                   isActive: initialData.isActive ?? true,
              });
         } else {
             form.reset({
                 name: '',
                 type: undefined,
                 description: '',
                 isActive: true,
             });
         }
     }, [initialData, form]);

    const [isLoading, setIsLoading] = useState(false);

    const onSubmit = async (values: ServiceFormData) => {
        setIsLoading(true);
        let result;

        if (serviceId) {
            result = await updateService(serviceId, values);
        } else {
            result = await createService(values);
        }

        setIsLoading(false);

        if (result?.success) {
            toast.success(result.success);
            router.push(`/services`);
            router.refresh();
        } else if (result?.error) {
            toast.error(result.error);
            if (result.details) {
                console.error('Validation details:', result.details);
            }
        } else {
             toast.error("An unexpected error occurred.");
        }
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
             <CardHeader>
                 <CardTitle>{serviceId ? 'Edit Service' : 'Create Service'}</CardTitle>
                 <p className="text-sm text-muted-foreground">
                     {serviceId ? `Edit details for service ID: ${serviceId}` : 'Fill in the details for a new service.'}
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
                                        <Input placeholder="Service Name" {...field} disabled={isLoading} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Service Type</FormLabel>
                                    <Select 
                                        onValueChange={field.onChange} 
                                        value={field.value} 
                                        disabled={isLoading || !!serviceId}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select service type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {Object.values(ServiceType).map(type => (
                                                <SelectItem key={type} value={type}>
                                                    {type.replace(/_/g, ' ')}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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
                                            placeholder="Service description..."
                                            {...field}
                                            disabled={isLoading}
                                            rows={4}
                                            value={field.value ?? ''}
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
                                </FormItem>
                            )}
                        />

                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (serviceId ? 'Saving...' : 'Creating...') : (serviceId ? 'Save Changes' : 'Create Service')}
                        </Button>
                    </form>
                </Form>
             </CardContent>
             {initialData && (
                 <CardFooter>
                     <p className="text-xs text-muted-foreground">
                         Created: {initialData.createdAt ? new Date(initialData.createdAt).toLocaleDateString() : 'N/A'} |
                         Last Updated: {initialData.updatedAt ? new Date(initialData.updatedAt).toLocaleDateString() : 'N/A'}
                     </p>
                 </CardFooter>
             )}
        </Card>
    );
}