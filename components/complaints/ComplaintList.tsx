// components/complaints/ComplaintList.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Prisma } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import StatusBadge from "./StatusBadge";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { deleteComplaint } from "@/actions/complaints/delete";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Use Prisma's generated type with proper includes
type ComplaintWithRelations = Prisma.ComplaintGetPayload<{
  include: {
    service: {
      select: {
        id: true;
        name: true;
        type: true;
      };
    };
    product: {
      select: {
        id: true;
        name: true;
        code: true;
      };
    };
    provider: {
      select: {
        id: true;
        name: true;
      };
    };
    submittedBy: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
    assignedAgent: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
    humanitarianOrg: {
      select: {
        id: true;
        name: true;
      };
    };
    parkingService: true;
  };
}>;

interface ComplaintListProps {
  complaints: ComplaintWithRelations[];
  totalComplaints: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  userRole: string;
}

export function ComplaintList({
  complaints,
  totalComplaints,
  page,
  pageSize,
  onPageChange,
  userRole,
}: ComplaintListProps) {
  const router = useRouter();

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const totalPages = Math.ceil(totalComplaints / pageSize);
  const isAdmin = userRole === "ADMIN" || userRole === "MANAGER";

  const handleView = (id: string) => {
    router.push(`/complaints/${id}`);
  };

  const handleEdit = (id: string) => {
    router.push(`/complaints/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      await deleteComplaint(deleteId);
      toast.success("Complaint has been deleted");
      setDeleteId(null);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete complaint");
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper function for safe date formatting
  const formatSafeDate = (date: Date | string | null | undefined) => {
    try {
      if (!date) return "N/A";
      const validDate = date instanceof Date ? date : new Date(date);
      if (isNaN(validDate.getTime())) return "Invalid Date";
      return formatDistanceToNow(validDate, { addSuffix: true });
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Error";
    }
  };

  return (
    <div className="w-full">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!Array.isArray(complaints) || complaints.length === 0) ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No complaints found
                </TableCell>
              </TableRow>
            ) : (
              complaints.map((complaint) => (
                <TableRow key={complaint.id}>
                  <TableCell className="font-medium">{complaint.title}</TableCell>
                  <TableCell>{complaint.service?.name || "N/A"}</TableCell>
                  <TableCell>{complaint.provider?.name || "N/A"}</TableCell>
                  <TableCell>
                    <StatusBadge status={complaint.status} />
                  </TableCell>
                  <TableCell>{complaint.priority}</TableCell>
                  <TableCell>
                    {formatSafeDate(complaint.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleView(complaint.id)}
                        title="View complaint"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEdit(complaint.id)}
                        title="Edit complaint"
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      
                      {isAdmin && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setDeleteId(complaint.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Delete complaint"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(Math.max(1, page - 1));
                }} 
                aria-disabled={page === 1}
                className={page === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <PaginationItem key={pageNum}>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onPageChange(pageNum);
                  }}
                  isActive={pageNum === page}
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            ))}
            
            <PaginationItem>
              <PaginationNext 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(Math.min(totalPages, page + 1));
                }} 
                aria-disabled={page === totalPages}
                className={page === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the complaint
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
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
    </div>
  );
}