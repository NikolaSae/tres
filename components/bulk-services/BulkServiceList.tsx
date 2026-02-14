//components/bulk-services/BulkServiceList.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, Eye, Edit, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { useBulkServices } from "@/hooks/use-bulk-services";
import { BulkServiceWithRelations } from "@/lib/types/bulk-service-types";

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

export default function BulkServiceList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Parse URL params
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const itemsPerPage = parseInt(searchParams.get("pageSize") || "10", 10);
  const search = searchParams.get("search") || undefined;
  const providerId = searchParams.get("providerId") || undefined;
  const serviceId = searchParams.get("serviceId") || undefined;
  
  // Initialize filters
  const initialFilters = {
    providerName: search,
    providerId: providerId,
    serviceId: serviceId,
  };
  
  // Use the hook with pagination
  const {
    bulkServices,
    loading,
    error,
    pagination,
    setPagination,
  } = useBulkServices(initialFilters, { page: currentPage, limit: itemsPerPage });

  // Sync pagination with URL
  useEffect(() => {
    setPagination({ page: currentPage, limit: itemsPerPage });
  }, [currentPage, itemsPerPage, setPagination]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    router.push(`/bulk-services?${params.toString()}`);
  };

  const handleItemsPerPageChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("pageSize", value);
    params.set("page", "1"); // Reset to first page
    router.push(`/bulk-services?${params.toString()}`);
  };

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    if (!bulkServices?.meta) return [];
    
    const { totalPages } = bulkServices.meta;
    const pages: number[] = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      if (start > 2) {
        pages.push(-1); // ellipsis
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < totalPages - 1) {
        pages.push(-1); // ellipsis
      }
      
      pages.push(totalPages);
    }
    
    return pages;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center text-center p-6 space-y-2">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <h3 className="text-lg font-semibold">Error loading bulk services</h3>
            <p className="text-sm text-muted-foreground">
              {typeof error === 'string' ? error : 'An error occurred'}
            </p>
            <Button 
              className="mt-4" 
              onClick={() => router.refresh()}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Extract data and meta
  const servicesData = bulkServices?.data || [];
  const meta = bulkServices?.meta || { totalCount: 0, page: 1, limit: 10, totalPages: 0 };

  if (servicesData.length === 0 && currentPage === 1) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center text-center p-6 space-y-2">
            <div className="rounded-full bg-primary/10 p-3">
              <AlertTriangle className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">No bulk services found</h3>
            <p className="text-sm text-muted-foreground">
              {(search || providerId || serviceId)
                ? "Try adjusting your search filters"
                : "Get started by creating a new bulk service"}
            </p>
            <Button 
              className="mt-4" 
              asChild
            >
              <Link href="/bulk-services/new">Create New</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const startItem = meta.totalCount === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const endItem = Math.min(meta.page * meta.limit, meta.totalCount);

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Provider</TableHead>
              <TableHead>Agreement</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Sender</TableHead>
              <TableHead>Requests</TableHead>
              <TableHead>Message Parts</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {servicesData.map((bulkService: BulkServiceWithRelations) => (
              <TableRow key={bulkService.id}>
                <TableCell>{bulkService.provider_name}</TableCell>
                <TableCell>{bulkService.agreement_name}</TableCell>
                <TableCell>{bulkService.service_name}</TableCell>
                <TableCell>{bulkService.sender_name}</TableCell>
                <TableCell>{bulkService.requests.toLocaleString()}</TableCell>
                <TableCell>{bulkService.message_parts.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="icon" asChild>
                      <Link href={`/bulk-services/${bulkService.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" size="icon" asChild>
                      <Link href={`/bulk-services/${bulkService.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      
      {/* Pagination Footer */}
      <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t">
        {/* Results info and per-page selector */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of{" "}
            <strong>{meta.totalCount}</strong> bulk services
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show:</span>
            <Select 
              value={itemsPerPage.toString()} 
              onValueChange={handleItemsPerPageChange}
            >
              <SelectTrigger className="w-[70px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option.toString()}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">per page</span>
          </div>
        </div>
        
        {/* Page navigation */}
        {meta.totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handlePageChange(currentPage - 1)} 
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {getPageNumbers().map((pageNum, idx) => {
                if (pageNum === -1) {
                  return (
                    <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">
                      ...
                    </span>
                  );
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className="min-w-[36px]"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handlePageChange(currentPage + 1)} 
              disabled={currentPage >= meta.totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}