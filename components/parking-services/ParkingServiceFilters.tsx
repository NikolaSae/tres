// components/parking-services/ParkingServiceFilters.tsx - ISPRAVLJEN
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const filterSchema = z.object({
  searchTerm: z.string().optional(),
  isActive: z.enum(["all", "true", "false"]).default("all"),
  serviceNumber: z.string().optional(),
  hasContracts: z.enum(["all", "true", "false"]).default("all"),
});

type FilterFormValues = z.infer<typeof filterSchema>;

interface ParkingServiceFiltersProps {
  initialFilters?: {
    searchTerm?: string;
    isActive?: boolean;
    serviceNumber?: string;
    hasContracts?: boolean;
    page?: number;
    pageSize?: number;
  };
}

export default function ParkingServiceFilters({ initialFilters }: ParkingServiceFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isFiltersActive, setIsFiltersActive] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const params = new URLSearchParams(searchParams.toString());
  
  const form = useForm<FilterFormValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      searchTerm: params.get("searchTerm") || initialFilters?.searchTerm || "",
      isActive: params.get("isActive") ? 
        (params.get("isActive") === "true" ? "true" : "false") : 
        (initialFilters?.isActive !== undefined ? 
          (initialFilters.isActive ? "true" : "false") : "all"),
      serviceNumber: params.get("serviceNumber") || initialFilters?.serviceNumber || "",
      hasContracts: params.get("hasContracts") ? 
        (params.get("hasContracts") === "true" ? "true" : "false") : 
        (initialFilters?.hasContracts !== undefined ? 
          (initialFilters.hasContracts ? "true" : "false") : "all"),
    },
  });

  useEffect(() => {
    const newParams = new URLSearchParams(searchParams.toString());
    const searchTerm = newParams.get("searchTerm") || "";
    const serviceNumber = newParams.get("serviceNumber") || "";
    
    const isActiveParam = newParams.get("isActive");
    let isActiveValue: "all" | "true" | "false" = "all";
    if (isActiveParam === "true") {
      isActiveValue = "true";
    } else if (isActiveParam === "false") {
      isActiveValue = "false";
    }
    
    const hasContractsParam = newParams.get("hasContracts");
    let hasContractsValue: "all" | "true" | "false" = "all";
    if (hasContractsParam === "true") {
      hasContractsValue = "true";
    } else if (hasContractsParam === "false") {
      hasContractsValue = "false";
    }
    
    form.reset({
      searchTerm,
      isActive: isActiveValue,
      serviceNumber,
      hasContracts: hasContractsValue,
    });

    if (serviceNumber || hasContractsValue !== "all") {
      setShowAdvanced(true);
    }
  }, [searchParams, form]);

  useEffect(() => {
    const searchTerm = form.watch("searchTerm");
    const isActive = form.watch("isActive");
    const serviceNumber = form.watch("serviceNumber");
    const hasContracts = form.watch("hasContracts");
    
    setIsFiltersActive(
      Boolean(searchTerm && searchTerm.length > 0) || 
      isActive !== "all" ||
      Boolean(serviceNumber && serviceNumber.length > 0) ||
      hasContracts !== "all"
    );
  }, [form.watch("searchTerm"), form.watch("isActive"), form.watch("serviceNumber"), form.watch("hasContracts")]);

  const onSubmit = (data: FilterFormValues) => {
    const newParams = new URLSearchParams();
    
    if (data.searchTerm && data.searchTerm.trim()) {
      newParams.set("searchTerm", data.searchTerm.trim());
    }
    
    if (data.isActive !== "all") {
      newParams.set("isActive", data.isActive);
    }

    if (data.serviceNumber && data.serviceNumber.trim()) {
      newParams.set("serviceNumber", data.serviceNumber.trim());
    }

    if (data.hasContracts !== "all") {
      newParams.set("hasContracts", data.hasContracts);
    }
    
    newParams.set("page", "1");
    
    const pageSize = searchParams.get("pageSize");
    if (pageSize) {
      newParams.set("pageSize", pageSize);
    }
    
    const queryString = newParams.toString();
    router.push(`/parking-services${queryString ? `?${queryString}` : ""}`);
  };

  const resetFilters = () => {
    const newParams = new URLSearchParams();
    newParams.set("page", "1");
    
    const pageSize = searchParams.get("pageSize");
    if (pageSize) {
      newParams.set("pageSize", pageSize);
    }
    
    const queryString = newParams.toString();
    router.push(`/parking-services${queryString ? `?${queryString}` : ""}`);
    setShowAdvanced(false);
  };

  const activeFilterCount = [
    Boolean(form.watch("searchTerm") && (form.watch("searchTerm") || "").length > 0),
    form.watch("isActive") !== "all",
    Boolean(form.watch("serviceNumber") && (form.watch("serviceNumber") || "").length > 0),
    form.watch("hasContracts") !== "all",
  ].filter(Boolean).length;

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <FormField
                control={form.control}
                name="searchTerm"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Search</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by name, email, contact..."
                          className="pl-8"
                          {...field}
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="w-full md:w-[180px]">
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="true">Active</SelectItem>
                        <SelectItem value="false">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Advanced
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
                
                {isFiltersActive && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetFilters}
                    className="flex items-center gap-1"
                  >
                    <X className="h-4 w-4" />
                    Clear
                  </Button>
                )}
                
                <Button type="submit" className="min-w-[100px]">
                  Apply Filters
                </Button>
              </div>
            </div>

            {showAdvanced && (
              <div className="pt-4 border-t flex flex-col gap-4 md:flex-row md:items-end">
                <FormField
                  control={form.control}
                  name="serviceNumber"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Service Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Search by service number (e.g., 7181)"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hasContracts"
                  render={({ field }) => (
                    <FormItem className="w-full md:w-[200px]">
                      <FormLabel>Contracts</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Filter by contracts" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="true">With Contracts</SelectItem>
                          <SelectItem value="false">Without Contracts</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}