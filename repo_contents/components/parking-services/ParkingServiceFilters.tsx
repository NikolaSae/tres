//components/parking-services/ParkingServiceFilters.tsx
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
import { Search, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const filterSchema = z.object({
  searchTerm: z.string().optional(),
  isActive: z.enum(["all", "true", "false"]).default("all"),
});

type FilterFormValues = z.infer<typeof filterSchema>;

interface ParkingServiceFiltersProps {
  initialFilters?: {
    searchTerm?: string;
    isActive?: boolean;
    page?: number;
    pageSize?: number;
  };
}

export default function ParkingServiceFilters({ initialFilters }: ParkingServiceFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isFiltersActive, setIsFiltersActive] = useState(false);

  // Create URLSearchParams object from current URL
  const params = new URLSearchParams(searchParams.toString());
  
  const form = useForm<FilterFormValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      searchTerm: params.get("searchTerm") || initialFilters?.searchTerm || "",
      isActive: params.get("isActive") ? 
        (params.get("isActive") === "true" ? "true" : "false") : 
        (initialFilters?.isActive !== undefined ? 
          (initialFilters.isActive ? "true" : "false") : "all"),
    },
  });

  // Update form when URL parameters change
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams.toString());
    const searchTerm = newParams.get("searchTerm") || "";
    const isActiveParam = newParams.get("isActive");
    let isActiveValue: "all" | "true" | "false" = "all";
    
    if (isActiveParam === "true") {
      isActiveValue = "true";
    } else if (isActiveParam === "false") {
      isActiveValue = "false";
    }
    
    form.reset({
      searchTerm,
      isActive: isActiveValue,
    });
  }, [searchParams, form]);

  // Check if any filters are active
  useEffect(() => {
    const searchTerm = form.watch("searchTerm");
    const isActive = form.watch("isActive");
    setIsFiltersActive(
      (searchTerm && searchTerm.length > 0) || isActive !== "all"
    );
  }, [form.watch("searchTerm"), form.watch("isActive")]);

  const onSubmit = (data: FilterFormValues) => {
    const newParams = new URLSearchParams();
    
    if (data.searchTerm && data.searchTerm.trim()) {
      newParams.set("searchTerm", data.searchTerm.trim());
    }
    
    if (data.isActive !== "all") {
      newParams.set("isActive", data.isActive);
    }
    
    // Reset to page 1 when filtering
    newParams.set("page", "1");
    
    // Preserve pageSize parameter
    const pageSize = searchParams.get("pageSize");
    if (pageSize) {
      newParams.set("pageSize", pageSize);
    }
    
    const queryString = newParams.toString();
    router.push(`/parking-services${queryString ? `?${queryString}` : ""}`);
  };

  const resetFilters = () => {
    // Create new params without filter values
    const newParams = new URLSearchParams();
    
    // Reset to page 1
    newParams.set("page", "1");
    
    // Preserve pageSize parameter
    const pageSize = searchParams.get("pageSize");
    if (pageSize) {
      newParams.set("pageSize", pageSize);
    }
    
    const queryString = newParams.toString();
    router.push(`/parking-services${queryString ? `?${queryString}` : ""}`);
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <Form {...form}>
          <form 
            onSubmit={form.handleSubmit(onSubmit)} 
            className="flex flex-col gap-4 md:flex-row md:items-end"
          >
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
                        placeholder="Search parking services..."
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
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <div className="flex gap-2 ml-auto">
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
                Filter
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}