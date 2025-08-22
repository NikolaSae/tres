//components/parking-services/ParkingServiceList.tsx
"use client";

import { useState, useEffect } from "react";
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
import { Pencil, Trash, Eye, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ParkingServiceItem } from "@/lib/types/parking-service-types";
import { formatDate } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { deleteService } from "@/actions/parking-services/delete";
import { toast } from "sonner";

interface ParkingServiceListProps {
  parkingServices: ParkingServiceItem[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

export default function ParkingServiceList({ 
  parkingServices, 
  totalCount, 
  currentPage, 
  pageSize, 
  totalPages 
}: ParkingServiceListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get current sort parameters
  const currentSortBy = searchParams.get('sortBy') || 'name';
  const currentSortDirection = searchParams.get('sortDirection') || 'asc';

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setIsDeleting(true);
      const result = await deleteService(deleteId);

      if(result.success){
        toast.success(result.message || "Parking service deleted successfully");
        
        // Create new URL without the deleted item
        const params = new URLSearchParams(searchParams.toString());
        
        // If we're on the last page and only one item remains, go to previous page
        if (parkingServices.length === 1 && currentPage > 1) {
          params.set('page', (currentPage - 1).toString());
        }
        
        router.push(`/parking-services?${params.toString()}`);
      } else {
        toast.error(result.error || "Failed to delete parking service");
      }

    } catch (error) {
      toast.error("An unexpected error occurred during deletion.");
      console.error(error);
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    return `?${params.toString()}`;
  };

  const handleSort = (column: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // If clicking on the same column, toggle direction
    if (currentSortBy === column) {
      const newDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
      params.set('sortDirection', newDirection);
    } else {
      // If clicking on a new column, set it as sortBy and default to asc
      params.set('sortBy', column);
      params.set('sortDirection', 'asc');
    }
    
    // Reset to page 1 when sorting
    params.set('page', '1');
    
    router.push(`/parking-services?${params.toString()}`);
  };

  const getSortIcon = (column: string) => {
    if (currentSortBy !== column) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    }
    
    return currentSortDirection === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
  };

  // Handle page count calculation edge cases
  const startItem = Math.max(0, (currentPage - 1) * pageSize) + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort('name')}
                >
                  Name
                  {getSortIcon('name')}
                </Button>
              </TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort('createdAt')}
                >
                  Created
                  {getSortIcon('createdAt')}
                </Button>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parkingServices.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No parking services found
                </TableCell>
              </TableRow>
            )}

            {parkingServices.map((service) => (
              <TableRow key={service.id}>
                <TableCell className="font-medium">{service.name}</TableCell>
                <TableCell>
                  {service.contactName}
                  {service.email && <div className="text-xs text-muted-foreground">{service.email}</div>}
                  {service.phone && <div className="text-xs text-muted-foreground">{service.phone}</div>}
                </TableCell>
                <TableCell>{service.address || "-"}</TableCell>
                <TableCell>
                  <Badge variant={service.isActive ? "default" : "secondary"}>
                    {service.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(service.createdAt)}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    onClick={() => router.push(`/parking-services/${service.id}`)}
                    size="icon"
                    variant="ghost"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => router.push(`/parking-services/${service.id}/edit`)}
                    size="icon"
                    variant="ghost"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(service.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the parking service
                          and remove associated data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          disabled={isDeleting}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {startItem} to {endItem} of {totalCount} results
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(createPageUrl(currentPage - 1))}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNumber}
                    variant={currentPage === pageNumber ? "default" : "outline"}
                    size="sm"
                    onClick={() => router.push(createPageUrl(pageNumber))}
                  >
                    {pageNumber}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(createPageUrl(currentPage + 1))}
              disabled={currentPage >= totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}