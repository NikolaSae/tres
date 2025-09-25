//components/bulk-services/BulkServiceForm.tsx

"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { BulkServiceFormValues, bulkServiceSchema } from "@/schemas/bulk-service";
import { createBulkService, updateBulkService } from "@/actions/bulk-services";
import { Service, Provider } from "@prisma/client";

interface BulkServiceFormProps {
  initialData?: any;
  services?: Service[];
  providers?: Provider[];
  isEditing?: boolean;
}

export const BulkServiceForm = ({
  initialData,
  services,
  providers,
  isEditing = false
}: BulkServiceFormProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const defaultValues = initialData ? {
    provider_name: initialData.provider_name || "",
    agreement_name: initialData.agreement_name || "",
    service_name: initialData.service_name || "",
    step_name: initialData.step_name || "",
    sender_name: initialData.sender_name || "",
    requests: initialData.requests || 0,
    message_parts: initialData.message_parts || 0,
    serviceId: initialData.serviceId || "",
    providerId: initialData.providerId || "",
  } : {
    provider_name: "",
    agreement_name: "",
    service_name: "",
    step_name: "",
    sender_name: "",
    requests: 0,
    message_parts: 0,
    serviceId: "",
    providerId: "",
  };

  const form = useForm<BulkServiceFormValues>({
    resolver: zodResolver(bulkServiceSchema),
    defaultValues
  });

  const onSubmit = async (values: BulkServiceFormValues) => {
    try {
      setLoading(true);
      
      if (isEditing && initialData?.id) {
        await updateBulkService(initialData.id, values);
        toast.success("Bulk service updated successfully");
      } else {
        await createBulkService(values);
        toast.success("Bulk service created successfully");
      }
      
      router.refresh();
      router.push("/bulk-services");
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {isEditing ? "Edit Bulk Service" : "Create Bulk Service"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="providerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider</FormLabel>
                    <Select
                      disabled={loading}
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a provider" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {providers?.map((provider) => (
                          <SelectItem key={provider.id} value={provider.id}>
                            {provider.name}
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
                name="serviceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service</FormLabel>
                    <Select
                      disabled={loading}
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {services?.filter(service => service.type === "BULK").map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name}
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
                name="provider_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider Name</FormLabel>
                    <FormControl>
                      <Input
                        disabled={loading}
                        placeholder="Provider name as shown in bulk service"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="agreement_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agreement Name</FormLabel>
                    <FormControl>
                      <Input
                        disabled={loading}
                        placeholder="Agreement name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="service_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Name</FormLabel>
                    <FormControl>
                      <Input
                        disabled={loading}
                        placeholder="Service name as shown in bulk service"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="step_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Step Name</FormLabel>
                    <FormControl>
                      <Input
                        disabled={loading}
                        placeholder="Step name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sender_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sender Name</FormLabel>
                    <FormControl>
                      <Input
                        disabled={loading}
                        placeholder="Sender name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requests</FormLabel>
                    <FormControl>
                      <Input
                        disabled={loading}
                        placeholder="Number of requests"
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message_parts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message Parts</FormLabel>
                    <FormControl>
                      <Input
                        disabled={loading}
                        placeholder="Number of message parts"
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center justify-end gap-x-2">
              <Button
                variant="outline"
                onClick={() => router.push("/bulk-services")}
                disabled={loading}
                type="button"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? <Spinner className="mr-2" /> : null}
                {isEditing ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};