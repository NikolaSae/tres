//components/bulk-services/BulkServiceDetails.tsx


"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  CalendarIcon, 
  ArrowRightIcon, 
  MessageCircleIcon, 
  CheckCircleIcon,
  EditIcon,
  TrashIcon,
  AlertCircleIcon
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

import { formatDate } from "@/lib/utils";
import { deleteBulkService } from "@/actions/bulk-services";
import { BulkService, Provider, Service } from "@prisma/client";

interface ExtendedBulkService extends BulkService {
  provider: Provider;
  service: Service;
}

interface BulkServiceDetailsProps {
  bulkService: ExtendedBulkService;
}

export const BulkServiceDetails = ({
  bulkService
}: BulkServiceDetailsProps) => {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteBulkService(bulkService.id);
      toast.success("Bulk service deleted successfully");
      router.refresh();
      router.push("/bulk-services");
    } catch (error) {
      console.error("Error deleting bulk service:", error);
      toast.error("Failed to delete bulk service");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Bulk Service Details</h2>
            <p className="text-muted-foreground">
              View and manage bulk service information
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => router.push(`/bulk-services/${bulkService.id}/edit`)}
              variant="outline"
              size="sm"
            >
              <EditIcon className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              onClick={() => setDeleteDialogOpen(true)}
              variant="destructive"
              size="sm"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Main details about the bulk service</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Provider</p>
                  <p className="text-sm">{bulkService.provider.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Service</p>
                  <p className="text-sm">{bulkService.service.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Provider Name</p>
                  <p className="text-sm">{bulkService.provider_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Agreement Name</p>
                  <p className="text-sm">{bulkService.agreement_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Service Name</p>
                  <p className="text-sm">{bulkService.service_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Step Name</p>
                  <p className="text-sm">{bulkService.step_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sender Name</p>
                  <p className="text-sm">{bulkService.sender_name}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Metrics</CardTitle>
              <CardDescription>Service performance metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Requests</p>
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                    <p className="text-sm font-semibold">{bulkService.requests.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Message Parts</p>
                  <div className="flex items-center">
                    <MessageCircleIcon className="h-4 w-4 text-blue-500 mr-2" />
                    <p className="text-sm font-semibold">{bulkService.message_parts.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Average Parts Per Request</p>
                  <div className="flex items-center">
                    <ArrowRightIcon className="h-4 w-4 text-orange-500 mr-2" />
                    <p className="text-sm font-semibold">
                      {bulkService.requests > 0 
                        ? (bulkService.message_parts / bulkService.requests).toFixed(2) 
                        : "0"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created At</p>
                  <div className="flex items-center mt-1">
                    <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                    <p className="text-sm">{formatDate(bulkService.createdAt)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                  <div className="flex items-center mt-1">
                    <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                    <p className="text-sm">{formatDate(bulkService.updatedAt)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ID</p>
                  <p className="text-sm text-muted-foreground mt-1">{bulkService.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge className="mt-1" variant="outline">Active</Badge>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/bulk-services")}
              >
                Back to Bulk Services
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure you want to delete this bulk service?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the bulk service
              and all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};