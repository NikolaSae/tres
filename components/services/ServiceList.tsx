///components/services/ServiceList.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowUpDown, 
  Check, 
  X,
  ChevronLeft,
  ChevronRight
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
  query?: string;
  type?: string;
  status?: string;
}

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

export function ServiceList({ serviceType }: ServiceListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const { services, isLoading, error } = useServices({ type: serviceType });
  const [sortField, setSortField] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  
  const [filters, setFilters] = useState<FilterState>({});
  
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const itemsPerPage = parseInt(searchParams.get("per_page") || "10", 10);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  const handleItemsPerPageChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("per_page", value);
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    return `?${params.toString()}`;
  };

  const filteredServices = (services || []).filter((service) => {
    if (filters.query && !service.name.toLowerCase().includes(filters.query.toLowerCase())) return false;
    if (filters.type && service.type !== filters.type) return false;
    if (filters.status) {
      if (filters.status === "active" && !service.isActive) return false;
      if (filters.status === "inactive" && service.isActive) return false;
    }
    return true;
  });

  const sortedServices = [...filteredServices].sort((a, b) => {
    if (sortField === "name") return sortDirection === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    if (sortField === "type") return sortDirection === "asc" ? a.type.localeCompare(b.type) : b.type.localeCompare(a.type);
    if (sortField === "updatedAt") return sortDirection === "asc" ? new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime() : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    return 0;
  });

  const totalCount = sortedServices.length;
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedServices = sortedServices.slice(startIndex, endIndex);
  
  const startItem = totalCount === 0 ? 0 : startIndex + 1;
  const endItem = Math.min(endIndex, totalCount);

  const getTypeColor = (type: string) => {
    switch (type) {
      case "VAS": return "bg-blue-100 text-blue-800";
      case "BULK": return "bg-purple-100 text-purple-800";
      case "HUMANITARIAN": return "bg-green-100 text-green-800";
      case "PARKING": return "bg-amber-100 text-amber-800";
      default: return "bg-gray-100 text-gray-800";
    }
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
        currentFilters={filters}
        onFilterChange={handleFilterChange}
        resultsCount={totalCount}
        totalCount={services?.length || 0}
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
                <TableHead onClick={() => handleSort("name")} className="cursor-pointer">
                  <div className="flex items-center">Name <ArrowUpDown className="ml-2 h-4 w-4" /></div>
                </TableHead>
                <TableHead onClick={() => handleSort("type")} className="cursor-pointer">
                  <div className="flex items-center">Type <ArrowUpDown className="ml-2 h-4 w-4" /></div>
                </TableHead>
                <TableHead>Providers</TableHead>
                <TableHead>Status</TableHead>
                <TableHead onClick={() => handleSort("updatedAt")} className="cursor-pointer">
                  <div className="flex items-center">Last Updated <ArrowUpDown className="ml-2 h-4 w-4" /></div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
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
              ) : paginatedServices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    {(filters.query || filters.type || filters.status) ? "No services match the current filters" : "No services found"}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getTypeColor(service.type)}>{service.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {getServiceProviders(service).map(provider => (
                          <Badge key={provider.id} variant="outline" className="bg-gray-100 text-gray-800">{provider.name}</Badge>
                        ))}
                        {getServiceProviders(service).length === 0 && <span className="text-muted-foreground text-sm">No providers</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {service.isActive ? (
                        <Badge variant="outline" className="bg-green-100 text-green-800"><Check className="mr-1 h-3 w-3" /> Active</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-100 text-red-800"><X className="mr-1 h-3 w-3" /> Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(service.updatedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/services/${service.type.toLowerCase()}/${service.id}/edit`}>
                        <Button size="sm" variant="outline">Edit</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {totalCount > 0 && (
            <div className="flex items-center justify-between mt-6">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-muted-foreground">Showing {startItem} to {endItem} of {totalCount} results</div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Show:</span>
                  <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                    <SelectTrigger className="w-[70px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ITEMS_PER_PAGE_OPTIONS.map((option) => <SelectItem key={option} value={option.toString()}>{option}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">per page</span>
                </div>
              </div>
              
              {totalPages > 1 && (
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => router.push(createPageUrl(currentPage - 1))} disabled={currentPage <= 1}><ChevronLeft className="h-4 w-4" />Previous</Button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) pageNumber = i + 1;
                      else if (currentPage <= 3) pageNumber = i + 1;
                      else if (currentPage >= totalPages - 2) pageNumber = totalPages - 4 + i;
                      else pageNumber = currentPage - 2 + i;
                      return <Button key={pageNumber} variant={currentPage === pageNumber ? "default" : "outline"} size="sm" onClick={() => router.push(createPageUrl(pageNumber))}>{pageNumber}</Button>;
                    })}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => router.push(createPageUrl(currentPage + 1))} disabled={currentPage >= totalPages}>Next<ChevronRight className="h-4 w-4" /></Button>
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
    service.vasServices.forEach(vas => { if (vas.provider) providers.push(vas.provider); });
  }
  
  if (service.bulkServices) {
    service.bulkServices.forEach(bulk => { if (bulk.provider) providers.push(bulk.provider); });
  }
  
  const uniqueProviders = providers.filter((provider, index, self) => index === self.findIndex(p => p.id === provider.id));
  
  return uniqueProviders;
}
