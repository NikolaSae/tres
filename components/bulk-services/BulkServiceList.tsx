//components/bulk-services/BulkServiceList.tsx


"use client";

import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, Eye, Edit, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { useBulkServices } from "@/hooks/use-bulk-services";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { BulkServiceWithRelations } from "@/lib/types/bulk-service-types";

export default function BulkServiceList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Parse pagination params
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "10");
  
  // Get filter params
  const search = searchParams.get("search") || "";
  const providerId = searchParams.get("providerId") || undefined;
  const serviceId = searchParams.get("serviceId") || undefined;
  
  // Fetch bulk services
  const { data, isLoading, error } = useBulkServices({
    page,
    pageSize,
    search,
    providerId: providerId as string,
    serviceId: serviceId as string
  });

  const bulkServices = data?.items || [];
  const totalPages = data?.totalPages || 1;

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    router.push(`/bulk-services?${params.toString()}`);
  };

  if (isLoading) {
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
            <p className="text-sm text-muted-foreground">{error.message}</p>
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

  if (bulkServices.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center text-center p-6 space-y-2">
            <div className="rounded-full bg-primary/10 p-3">
              <AlertTriangle className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">No bulk services found</h3>
            <p className="text-sm text-muted-foreground">
              {search
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
            {bulkServices.map((bulkService: BulkServiceWithRelations) => (
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
      <CardFooter className="flex items-center justify-between p-4 border-t">
        <div className="text-sm text-muted-foreground">
          Showing <strong>{bulkServices.length}</strong> of{" "}
          <strong>{data?.totalCount || 0}</strong> bulk services
        </div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1} 
              />
            </PaginationItem>
            <PaginationItem>
              <span className="px-4 py-1">
                Page {page} of {totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext 
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages} 
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </CardFooter>
    </Card>
  );
}