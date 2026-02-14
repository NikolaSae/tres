"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ServiceType } from "@prisma/client";
import { 
  ArrowUpDown, 
  Check, 
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { useServices } from "@/hooks/use-services";
import { formatDate } from "@/lib/utils";
import { ServiceFilters } from "./ServiceFilters";

interface ServiceListProps {
  serviceType?: string;
}

interface FilterState {
  search?: string;
  type?: string;
  isActive?: boolean;
}

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

export function ServiceList({ serviceType }: ServiceListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Cast serviceType to ServiceType if it's defined
  const typedServiceType = serviceType as ServiceType | undefined;
  
  // Get URL params
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const itemsPerPage = parseInt(searchParams.get("per_page") || "10", 10);
  const urlSearch = searchParams.get("query") || undefined;
  const urlType = searchParams.get("type") || undefined;
  const urlStatus = searchParams.get("status") || undefined;
  
  // Initialize filters from URL or props
  const initialFilters = {
    search: urlSearch,
    type: (urlType as ServiceType | undefined) || typedServiceType,
    isActive: urlStatus === "active" ? true : urlStatus === "inactive" ? false : undefined,
  };
  
  // Use the services hook with proper arguments
  const {
    services,
    totalCount,
    loading,
    error,
    filters,
    pagination,
    setFilters,
    setPagination,
  } = useServices(initialFilters, { page: currentPage, limit: itemsPerPage });

  const [sortField, setSortField] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Sync hook pagination with URL params
  useEffect(() => {
    setPagination({
      page: currentPage,
      limit: itemsPerPage,
    });
  }, [currentPage, itemsPerPage, setPagination]);

  // Sync hook filters with URL params
  useEffect(() => {
    setFilters({
      search: urlSearch,
      type: (urlType as ServiceType | undefined) || typedServiceType,
      isActive: urlStatus === "active" ? true : urlStatus === "inactive" ? false : undefined,
    });
  }, [urlSearch, urlType, urlStatus, typedServiceType, setFilters]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleFilterChange = (newFilters: FilterState) => {
    const params = new URLSearchParams();
    
    // Reset to page 1 when filters change
    params.set("page", "1");
    params.set("per_page", itemsPerPage.toString());
    
    if (newFilters.search) {
      params.set("query", newFilters.search);
    }
    if (newFilters.type) {
      params.set("type", newFilters.type);
    }
    if (newFilters.isActive !== undefined) {
      params.set("status", newFilters.isActive ? "active" : "inactive");
    }
    
    router.push(`?${params.toString()}`);
  };

  const handleItemsPerPageChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("per_page", value);
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  const handlePageChange = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    router.push(`?${params.toString()}`);
  };

  // Sort services (client-side sorting of the current page)
  const sortedServices = [...services].sort((a, b) => {
    if (sortField === "name") {
      return sortDirection === "asc" 
        ? a.name.localeCompare(b.name) 
        : b.name.localeCompare(a.name);
    }
    if (sortField === "type") {
      return sortDirection === "asc" 
        ? a.type.localeCompare(b.type) 
        : b.type.localeCompare(a.type);
    }
    if (sortField === "updatedAt") {
      const dateA = new Date(a.updatedAt).getTime();
      const dateB = new Date(b.updatedAt).getTime();
      return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
    }
    return 0;
  });

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalCount);

  const getTypeColor = (type: string) => {
    switch (type) {
      case "VAS": return "bg-blue-100 text-blue-800";
      case "BULK": return "bg-purple-100 text-purple-800";
      case "HUMANITARIAN": return "bg-green-100 text-green-800";
      case "PARKING": return "bg-amber-100 text-amber-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
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

  // Convert filters for ServiceFilters component
  const currentFiltersForComponent = {
    query: filters.search,
    type: filters.type,
    status: filters.isActive === true ? "active" : filters.isActive === false ? "inactive" : undefined,
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-destructive">
          Error loading services: {error.message}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <ServiceFilters
        currentFilters={currentFiltersForComponent}
        onFilterChange={(newFilters) => {
          handleFilterChange({
            search: newFilters.query,
            type: newFilters.type,
            isActive: newFilters.status === "active" ? true : newFilters.status === "inactive" ? false : undefined,
          });
        }}
        resultsCount={totalCount}
        totalCount={totalCount}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Services</CardTitle>
          <Link href="/services/new">
            <Button>Add New Service</Button>
          </Link>
        </CardHeader>
        
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead onClick={() => handleSort("name")} className="cursor-pointer hover:bg-muted/50">
                  <div className="flex items-center">
                    Name 
                    <ArrowUpDown className={`ml-2 h-4 w-4 ${sortField === 'name' ? 'text-primary' : ''}`} />
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("type")} className="cursor-pointer hover:bg-muted/50">
                  <div className="flex items-center">
                    Type 
                    <ArrowUpDown className={`ml-2 h-4 w-4 ${sortField === 'type' ? 'text-primary' : ''}`} />
                  </div>
                </TableHead>
                <TableHead>Providers</TableHead>
                <TableHead>Status</TableHead>
                <TableHead onClick={() => handleSort("updatedAt")} className="cursor-pointer hover:bg-muted/50">
                  <div className="flex items-center">
                    Last Updated 
                    <ArrowUpDown className={`ml-2 h-4 w-4 ${sortField === 'updatedAt' ? 'text-primary' : ''}`} />
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: Math.min(itemsPerPage, 5) }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-6 w-[150px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[100px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[150px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[70px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[120px]" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-6 w-[80px] ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : sortedServices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {(filters.search || filters.type || filters.isActive !== undefined) 
                      ? "No services match the current filters" 
                      : "No services found"}
                  </TableCell>
                </TableRow>
              ) : (
                sortedServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getTypeColor(service.type)}>
                        {service.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {getServiceProviders(service).map(provider => (
                          <Badge 
                            key={provider.id} 
                            variant="outline" 
                            className="bg-gray-100 text-gray-800"
                          >
                            {provider.name}
                          </Badge>
                        ))}
                        {getServiceProviders(service).length === 0 && (
                          <span className="text-muted-foreground text-sm">No providers</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {service.isActive ? (
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          <Check className="mr-1 h-3 w-3" /> Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-100 text-red-800">
                          <X className="mr-1 h-3 w-3" /> Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(service.updatedAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" asChild>
                          <Link href={`/services/${service.type.toLowerCase()}/${service.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="outline" size="icon" asChild>
                          <Link href={`/services/${service.type.toLowerCase()}/${service.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          {totalCount > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
              {/* Results info and per-page selector */}
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of <strong>{totalCount}</strong> results
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
              {totalPages > 1 && (
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
                    disabled={currentPage >= totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function getServiceProviders(service: any) {
  const providers: any[] = [];
  
  if (service.vasServices) {
    service.vasServices.forEach((vas: any) => { 
      if (vas.provider) providers.push(vas.provider); 
    });
  }
  
  if (service.bulkServices) {
    service.bulkServices.forEach((bulk: any) => { 
      if (bulk.provider) providers.push(bulk.provider); 
    });
  }
  
  const uniqueProviders = providers.filter((provider, index, self) => 
    index === self.findIndex(p => p.id === provider.id)
  );
  
  return uniqueProviders;
}