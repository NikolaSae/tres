// components/humanitarian-orgs/HumanitarianOrgForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { humanitarianOrgSchema, HumanitarianOrgFormData } from "@/schemas/humanitarian-org";
import { createHumanitarianOrg } from "@/actions/humanitarian-orgs/create";
import { updateHumanitarianOrg } from "@/actions/humanitarian-orgs/update";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface HumanitarianOrgFormProps {
  organization?: {
    id: string;
    name: string;
    contactName: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    website: string | null;
    mission: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    pib: string | null;
    registrationNumber: string | null;
    bank: string | null;
    accountNumber: string | null;
    shortNumber: string | null;
  };
  isEditing?: boolean;
}

export function HumanitarianOrgForm({ organization, isEditing = false }: HumanitarianOrgFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<HumanitarianOrgFormData>({
    resolver: zodResolver(humanitarianOrgSchema),
    defaultValues: isEditing && organization
      ? {
          name: organization.name,
          contactName: organization.contactName ?? '',
          email: organization.email ?? '',
          phone: organization.phone ?? '',
          address: organization.address ?? '',
          website: organization.website ?? '',
          mission: organization.mission ?? '',
          isActive: organization.isActive,
          pib: organization.pib ?? '',
          registrationNumber: organization.registrationNumber ?? '',
          bank: organization.bank ?? '',
          accountNumber: organization.accountNumber ?? '',
          shortNumber: organization.shortNumber ?? '',
        }
      : {
          isActive: true,
          name: '',
          contactName: '',
          email: '',
          phone: '',
          address: '',
          website: '',
          mission: '',
          pib: '',
          registrationNumber: '',
          bank: '',
          accountNumber: '',
          shortNumber: '',
        },
    mode: 'onBlur',
  });

  const onSubmit = async (data: HumanitarianOrgFormData) => {
    try {
      setIsLoading(true);
      let result;
      
      if (isEditing && organization) {
        result = await updateHumanitarianOrg(organization.id, data);
      } else {
        result = await createHumanitarianOrg(data);
      }

      if (result?.success) {
        toast.success(isEditing ? "Organization updated successfully!" : "Organization created successfully!");
        const newItemId = isEditing ? organization?.id : result.id;
        router.push(newItemId ? `/humanitarian-orgs/${newItemId}` : '/humanitarian-orgs');
      } else {
        toast.error(result?.error || 'An unknown error occurred.');
      }
    } catch (error) {
      toast.error(`An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Name *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter organization name" 
                        {...field} 
                      />
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
                    <FormLabel>Contact Person</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter contact person name" 
                        {...field} 
                      />
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder="Enter email" 
                        {...field} 
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
                        type="tel"
                        placeholder="Enter phone number" 
                        {...field} 
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
                        type="url"
                        placeholder="Enter website URL" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center space-x-2 pt-7">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
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
              </div>
            </div>
          </CardContent>
        </Card>

        {/* NEW: Financial Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="pib"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PIB</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter PIB" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="registrationNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Matični broj</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter registration number" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bank"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Banka</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter bank name" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tekući račun</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter account number" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shortNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kratki broj</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter short number" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter address" 
                        rows={2}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mission"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mission Statement</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter organization mission" 
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 pt-4">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : isEditing ? "Update Organization" : "Create Organization"}
          </Button>
        </div>
      </form>
    </Form>
  );
}