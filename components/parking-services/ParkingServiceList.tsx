//components/parking-services/ParkingServiceList.tsx
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
import { Pencil, Trash, Eye, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { deleteService } from "@/actions/parking-services/delete";
import { toast } from "sonner";

interface Service {
  id: string;
  name: string;
  type: string;
}

interface ParkingServiceItem {
  id: string;
  name: string;
  description: string | null;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  additionalEmails: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastReportSentAt: Date | null;
  totalReportsSent: number;
  contractCount: number;
  transactionCount: number;
  services: Service[];
}

interface ParkingServiceListProps {
  parkingServices: ParkingServiceItem[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

const getServiceTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    VAS: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    BULK: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    HUMANITARIAN: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    PARKING: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  };
  return colors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
};

const extractServiceNumber = (serviceName: string): string => {
  // Extract 4-digit number from service name (e.g., S___7181AleksinacZona1 -> 7181)
  const match = serviceName.match(/\d{4}/);
  return match ? match[0] : serviceName;
};

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
              <TableHead>Connected Services</TableHead>
              <TableHead>Contracts</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Report</TableHead>
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
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No parking services found
                </TableCell>
              </TableRow>
            )}

            {parkingServices.map((service) => (
              <TableRow key={service.id}>
                <TableCell className="font-medium">
                  <div>{service.name}</div>
                  {service.address && (
                    <div className="text-xs text-muted-foreground">{service.address}</div>
                  )}
                </TableCell>
                <TableCell>
                  {service.contactName && <div>{service.contactName}</div>}
                  {service.email && <div className="text-xs text-muted-foreground">{service.email}</div>}
                  {service.phone && <div className="text-xs text-muted-foreground">{service.phone}</div>}
                  {!service.contactName && !service.email && !service.phone && "-"}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {service.services && service.services.length > 0 ? (
                      service.services.map((srv) => (
                        <Badge
                          key={srv.id}
                          variant="outline"
                          className={`text-xs ${getServiceTypeColor(srv.type)}`}
                          title={srv.name} // Show full name on hover
                        >
                          {extractServiceNumber(srv.name)}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground text-sm">No services</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-mono">
                    {service.contractCount || 0}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={service.isActive ? "default" : "secondary"}>
                    {service.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {service.lastReportSentAt ? (
                    <div className="text-sm">
                      <div>{formatDate(service.lastReportSentAt)}</div>
                      <div className="text-muted-foreground text-xs">
                        Total: {service.totalReportsSent}
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
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