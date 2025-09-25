//components/parking-services/ParkingServiceForm.tsx
//components/parking-services/ParkingServiceForm.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createParkingServiceSchema } from "@/schemas/parking-service";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { ParkingServiceFormData } from "@/lib/types/parking-service-types";
import { create } from "@/actions/parking-services/create";
import { update } from "@/actions/parking-services/update";

interface ParkingServiceFormProps {
  initialData?: ParkingServiceFormData;
  isEditing?: boolean;
}

export default function ParkingServiceForm({
  initialData,
  isEditing = false
}: ParkingServiceFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ParkingServiceFormData>({
    resolver: zodResolver(createParkingServiceSchema),
    defaultValues: initialData || {
      name: "",
      contactName: "",
      email: "",
      phone: "",
      address: "",
      description: "",
      additionalEmails: [],
      isActive: true,
    },
  });

  // Use field array for managing additional emails
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "additionalEmails",
  });

  const onSubmit = async (data: ParkingServiceFormData) => {
    try {
      setIsSubmitting(true);

      // Filter out empty email addresses
      const cleanedData = {
        ...data,
        additionalEmails: data.additionalEmails?.filter(email => email.trim() !== "") || []
      };

      let result;
      if (isEditing && initialData?.id) {
        result = await update({ id: initialData.id, ...cleanedData });
      } else {
        result = await create(cleanedData);
      }

      if (result.success) {
         toast.success(isEditing ? "Parking service updated successfully" : "Parking service created successfully");
         if (result.data?.id) {
            router.push(`/parking-services/${result.data.id}`);
         } else {
             router.push('/parking-services');
         }
      } else {
         toast.error(result.error || (isEditing ? "Failed to update parking service" : "Failed to create parking service"));
      }

    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(isEditing
        ? "Failed to update parking service due to an unexpected error."
        : "Failed to create parking service due to an unexpected error."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const addEmailField = () => {
    append("");
  };

  const removeEmailField = (index: number) => {
    remove(index);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter parking service name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contactName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter contact person's name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Primary Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Enter primary contact email"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter contact phone number"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem className="col-span-1 md:col-span-2">
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter address"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="col-span-1 md:col-span-2">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter service description"
                    rows={4}
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Additional Emails Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel>Additional Email Addresses</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addEmailField}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Email
                </Button>
              </div>
              
              {fields.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No additional email addresses added yet.
                </p>
              )}

              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <FormField
                    control={form.control}
                    name={`additionalEmails.${index}`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Enter additional email address"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeEmailField(index)}
                    className="px-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>Active Status</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Set whether this parking service is currently active
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              isEditing ? "Updating..." : "Creating..."
            ) : (
              isEditing ? "Update Parking Service" : "Create Parking Service"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}