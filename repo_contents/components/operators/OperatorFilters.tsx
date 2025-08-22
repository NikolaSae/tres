// components/operators/OperatorFilters.tsx


"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Filter } from "lucide-react";

export function OperatorFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Get current filters from URL
  const currentStatus = searchParams?.get("status") || "all";

  // Update the URL with new filters
  const createQueryString = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams?.toString());
    
    if (value === "all") {
      params.delete(name);
    } else {
      params.set(name, value);
    }
    
    return params.toString();
  };

  // Handle filter change
  const handleStatusChange = (value: string) => {
    router.push(`${pathname}?${createQueryString("status", value)}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-9">
          <Filter className="mr-2 h-4 w-4" />
          Filters
          {currentStatus !== "all" && (
            <span className="ml-2 rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
              1
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={currentStatus} onValueChange={handleStatusChange}>
          <DropdownMenuRadioItem value="all">All Operators</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="active">Active Only</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="inactive">Inactive Only</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}