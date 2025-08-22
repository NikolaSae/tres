// components/operators/OperatorForm.tsx

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

import { operatorSchema, type OperatorFormValues } from "@/schemas/operator";
import { createOperator, updateOperator } from "@/actions/operators";
import { Operator } from "@prisma/client";

interface OperatorFormProps {
  operator?: Operator;
}

export function OperatorForm({ operator }: OperatorFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Determine if we're editing or creating
  const isEditing = !!operator;

  // Initialize form with existing operator data or defaults
  const form = useForm<OperatorFormValues>({
    resolver: zodResolver(operatorSchema),
    defaultValues: {
      name: operator?.name || "",
      code: operator?.code || "",
      description: operator?.description || "",
      logoUrl: operator?.logoUrl || "",
      website: operator?.website || "",
      contactEmail: operator?.contactEmail || "",
      contactPhone: operator?.contactPhone || "",
      active: operator?.active ?? true,
    },
  });

  async function onSubmit(data: OperatorFormValues) {
    console.log("Form submitted with data:", data);
    setIsLoading(true);
    
    try {
      if (isEditing && operator) {
        console.log("Updating operator:", operator.id);
        const result = await updateOperator(operator.id, data);
        console.log("Update result:", result);
        
        if (result?.error) {
          toast.error(result.error);
          if (result.details) {
            console.error("Validation details:", result.details);
          }
        } else if (result?.success) {
          toast.success("Operator updated successfully");
          router.push(`/operators/${operator.id}`);
          router.refresh();
        } else {
          toast.error("Operator update failed");
        }
      } else {
        console.log("Creating new operator");
        const result = await createOperator(data);
        console.log("Create result:", result);
        
        if (result?.error) {
          toast.error(result.error);
          if (result.details) {
            console.error("Validation details:", result.details);
          }
        } else if (result?.success && result.data) {
          toast.success("Operator created successfully");
          router.push(`/operators/${result.data.id}`);
          router.refresh();
        } else {
          toast.error("Operator creation failed");
        }
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // Handle form submission with proper validation
  const handleFormSubmit = async (e: React.FormEvent) => {
    console.log("Form submit event triggered");
    e.preventDefault();
    
    // Manually trigger validation and submission
    const isValid = await form.trigger();
    console.log("Form validation result:", isValid);
    
    if (isValid) {
      const formData = form.getValues();
      console.log("Form data to submit:", formData);
      await onSubmit(formData);
    } else {
      console.log("Form validation failed:", form.formState.errors);
      toast.error("Please fix the form errors before submitting");
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operator Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter operator name" 
                        {...field} 
                        disabled={isLoading}
                      />
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
                    <FormLabel>Operator Code</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter unique code" 
                        {...field} 
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      A unique identifier for the operator
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter operator description"
                        className="min-h-32"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo URL</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com/logo.png" 
                        {...field} 
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com" 
                        {...field} 
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="contact@example.com" 
                        {...field} 
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Phone</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="+1234567890" 
                        {...field} 
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="active"
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
                      <FormLabel>Active</FormLabel>
                      <FormDescription>
                        Inactive operators won't be available for new contracts
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (isEditing && operator) {
                    router.push(`/operators/${operator.id}`);
                  } else {
                    router.push("/operators");
                  }
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Update Operator" : "Create Operator"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}