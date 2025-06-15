// /components/contracts/status-change-dialog.tsx
"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { ContractStatus } from "@/lib/types/contract-types";
import { updateContractStatus } from "@/actions/contracts/contract-actions";

const statusChangeSchema = z.object({
  status: z.nativeEnum(ContractStatus),
  comments: z.string().optional(),
});

type StatusChangeFormData = z.infer<typeof statusChangeSchema>;

interface StatusChangeDialogProps {
  contractId: string;
  open: boolean;
  onClose: () => void;
  currentStatus: ContractStatus;
  contractName: string;
  onSuccess?: () => void;
}

const STATUS_OPTIONS = [
  { 
    value: ContractStatus.ACTIVE, 
    label: "Active", 
    description: "Contract is currently active and in effect",
    icon: CheckCircle,
    color: "bg-green-100 text-green-800 border-green-200"
  },
  { 
    value: ContractStatus.PENDING, 
    label: "Pending", 
    description: "Contract is pending approval or activation",
    icon: Clock,
    color: "bg-yellow-100 text-yellow-800 border-yellow-200"
  },
  { 
    value: ContractStatus.RENEWAL_IN_PROGRESS, 
    label: "Renewal in Progress", 
    description: "Contract renewal process has been initiated",
    icon: RefreshCw,
    color: "bg-blue-100 text-blue-800 border-blue-200"
  },
  { 
    value: ContractStatus.EXPIRED, 
    label: "Expired", 
    description: "Contract has reached its end date",
    icon: XCircle,
    color: "bg-red-100 text-red-800 border-red-200"
  },
  { 
    value: ContractStatus.TERMINATED, 
    label: "Terminated", 
    description: "Contract has been terminated before its end date",
    icon: XCircle,
    color: "bg-red-100 text-red-800 border-red-200"
  },
];

export function StatusChangeDialog({ 
  contractId, 
  open, 
  onClose, 
  currentStatus,
  contractName,
  onSuccess
}: StatusChangeDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<StatusChangeFormData>({
    resolver: zodResolver(statusChangeSchema),
    defaultValues: {
      status: currentStatus,
      comments: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        status: currentStatus,
        comments: ''
      });
    }
  }, [open, currentStatus, form]);

  const onSubmit = async (data: StatusChangeFormData) => {
    if (data.status === currentStatus) {
      toast.info('No changes to save');
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateContractStatus(
        contractId, 
        data.status, 
        data.comments || ''
      );

      if (result.success) {
        toast.success(result.message || 'Contract status updated successfully');
        onClose();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error(result.message || 'Failed to update contract status');
      }
    } catch (error) {
      console.error('Error updating contract status:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedStatus = form.watch('status');
  const selectedStatusOption = STATUS_OPTIONS.find(option => option.value === selectedStatus);

  const getStatusBadge = (status: ContractStatus) => {
    const statusOption = STATUS_OPTIONS.find(opt => opt.value === status);
    if (!statusOption) return null;

    const Icon = statusOption.icon;
    return (
      <Badge className={`font-medium ${statusOption.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {statusOption.label}
      </Badge>
    );
  };

  const getStatusChangeWarning = (newStatus: ContractStatus) => {
    if (currentStatus === ContractStatus.RENEWAL_IN_PROGRESS && newStatus !== ContractStatus.RENEWAL_IN_PROGRESS) {
      return {
        type: 'warning',
        message: 'Changing status will terminate the ongoing renewal process. The active renewal will be marked as inactive.'
      };
    }
    
    if (newStatus === ContractStatus.TERMINATED) {
      return {
        type: 'destructive',
        message: 'Contract termination is irreversible. Please ensure all necessary procedures have been completed.'
      };
    }

    if (newStatus === ContractStatus.EXPIRED) {
      return {
        type: 'warning',
        message: 'Setting contract to expired will prevent further operations. Consider renewal if the contract should continue.'
      };
    }

    return null;
  };

  const warning = selectedStatus ? getStatusChangeWarning(selectedStatus) : null;
  const hasChanges = selectedStatus !== currentStatus;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Change Contract Status
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Contract</p>
                  <p className="text-sm font-semibold">{contractName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Current Status</p>
                  <div className="flex justify-end">
                    {getStatusBadge(currentStatus)}
                  </div>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Status</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select new status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {STATUS_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center space-x-2">
                              <Icon className="h-4 w-4" />
                              <div>
                                <p className="font-medium">{option.label}</p>
                                <p className="text-xs text-muted-foreground">{option.description}</p>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedStatusOption && hasChanges && (
              <div className="p-4 border rounded-lg">
                <div className="flex items-start space-x-3">
                  <selectedStatusOption.icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{selectedStatusOption.label}</p>
                    <p className="text-sm text-muted-foreground">{selectedStatusOption.description}</p>
                  </div>
                </div>
              </div>
            )}

            {warning && hasChanges && (
              <div className={`p-4 rounded-lg border ${
                warning.type === 'destructive' 
                  ? 'bg-red-50 border-red-200 text-red-800' 
                  : 'bg-yellow-50 border-yellow-200 text-yellow-800'
              }`}>
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 mt-0.5" />
                  <p className="text-sm">{warning.message}</p>
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comments</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any notes about this status change..."
                      className="min-h-[100px]"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting || !hasChanges}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Status"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}