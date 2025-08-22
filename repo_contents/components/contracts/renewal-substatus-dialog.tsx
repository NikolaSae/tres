// /components/contracts/renewal-substatus-dialog.tsx
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
import { 
  AlertTriangle, 
  RefreshCw, 
  FileText, 
  Scale, 
  DollarSign, 
  PenTool, 
  CheckCircle, 
  Settings, 
  UserCheck 
} from "lucide-react";
import { toast } from "sonner";
import { ContractRenewalSubStatus } from "@prisma/client";
import { updateRenewalSubStatus, completeContractRenewal } from "@/lib/actions/contracts/contract-actions";

const renewalSubStatusSchema = z.object({
  subStatus: z.enum([
    ContractRenewalSubStatus.DOCUMENT_COLLECTION,
    ContractRenewalSubStatus.LEGAL_REVIEW,
    ContractRenewalSubStatus.TECHNICAL_REVIEW,
    ContractRenewalSubStatus.FINANCIAL_APPROVAL,
    ContractRenewalSubStatus.MANAGEMENT_APPROVAL,
    ContractRenewalSubStatus.AWAITING_SIGNATURE,
    ContractRenewalSubStatus.FINAL_PROCESSING,
  ] as const),
  comments: z.string().optional(),
});

type RenewalSubStatusFormData = z.infer<typeof renewalSubStatusSchema>;

interface RenewalSubStatusDialogProps {
  contractId: string;
  open: boolean;
  onClose: () => void;
  onStatusUpdated?: () => void;
  currentSubStatus: ContractRenewalSubStatus;
  contractName: string;
}

const SUBSTATUS_OPTIONS = [
  { 
    value: ContractRenewalSubStatus.DOCUMENT_COLLECTION, 
    label: "Document Collection", 
    description: "Gathering required documents for renewal",
    icon: FileText,
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    order: 1
  },
  { 
    value: ContractRenewalSubStatus.LEGAL_REVIEW, 
    label: "Legal Review", 
    description: "Legal team reviewing contract terms",
    icon: Scale,
    color: "bg-purple-100 text-purple-800 border-purple-200",
    order: 2
  },
  { 
    value: ContractRenewalSubStatus.TECHNICAL_REVIEW, 
    label: "Technical Review", 
    description: "Technical assessment of contract requirements",
    icon: Settings,
    color: "bg-cyan-100 text-cyan-800 border-cyan-200",
    order: 3
  },
  { 
    value: ContractRenewalSubStatus.FINANCIAL_APPROVAL, 
    label: "Financial Approval", 
    description: "Awaiting financial approval for renewal",
    icon: DollarSign,
    color: "bg-blue-100 text-blue-800 border-blue-200",
    order: 4
  },
  { 
    value: ContractRenewalSubStatus.MANAGEMENT_APPROVAL, 
    label: "Management Approval", 
    description: "Awaiting management approval",
    icon: UserCheck,
    color: "bg-pink-100 text-pink-800 border-pink-200",
    order: 5
  },
  { 
    value: ContractRenewalSubStatus.AWAITING_SIGNATURE, 
    label: "Awaiting Signature", 
    description: "Contract is ready for signature",
    icon: PenTool,
    color: "bg-indigo-100 text-indigo-800 border-indigo-200",
    order: 6
  },
  { 
    value: ContractRenewalSubStatus.FINAL_PROCESSING, 
    label: "Final Processing", 
    description: "Final steps before renewal completion",
    icon: CheckCircle,
    color: "bg-green-100 text-green-800 border-green-200",
    order: 7
  },
];

export function RenewalSubStatusDialog({ 
  contractId, 
  open, 
  onClose, 
  onStatusUpdated,
  currentSubStatus,
  contractName
}: RenewalSubStatusDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const form = useForm<RenewalSubStatusFormData>({
    resolver: zodResolver(renewalSubStatusSchema),
    defaultValues: {
      subStatus: currentSubStatus,
      comments: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        subStatus: currentSubStatus,
        comments: ''
      });
    }
  }, [open, currentSubStatus, form]);

  const onSubmit = async (data: RenewalSubStatusFormData) => {
    if (data.subStatus === currentSubStatus) {
      toast.info('No changes to save');
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateRenewalSubStatus(
        contractId, 
        data.subStatus, 
        data.comments
      );

      if (result.success) {
        toast.success(result.message);
        onStatusUpdated?.();
        onClose();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error updating renewal sub-status:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteRenewal = async () => {
    setIsCompleting(true);
    try {
      const result = await completeContractRenewal(
        contractId,
        undefined,
        form.getValues('comments') || 'Renewal completed'
      );

      if (result.success) {
        toast.success('Contract renewal completed successfully');
        onStatusUpdated?.();
        onClose();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error completing renewal:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsCompleting(false);
    }
  };

  const selectedSubStatus = form.watch('subStatus');
  const selectedSubStatusOption = SUBSTATUS_OPTIONS.find(option => option.value === selectedSubStatus);
  const currentSubStatusOption = SUBSTATUS_OPTIONS.find(option => option.value === currentSubStatus);

  const getSubStatusBadge = (subStatus: ContractRenewalSubStatus) => {
    const subStatusOption = SUBSTATUS_OPTIONS.find(opt => opt.value === subStatus);
    if (!subStatusOption) return null;

    const Icon = subStatusOption.icon;
    
    return (
      <Badge className={`font-medium flex items-center gap-1 ${subStatusOption.color}`}>
        <Icon className="h-3 w-3" />
        {subStatusOption.label}
      </Badge>
    );
  };

  const canCompleteRenewal = selectedSubStatus === ContractRenewalSubStatus.FINAL_PROCESSING;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-blue-600" />
            Update Renewal Status - {contractName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Current Status</p>
                <div className="mt-1">
                  {getSubStatusBadge(currentSubStatus)}
                </div>
              </div>
              {currentSubStatusOption && (
                <div className="text-right">
                  <p className="text-xs text-gray-500">{currentSubStatusOption.description}</p>
                  <p className="text-xs text-gray-400 mt-1">Step {currentSubStatusOption.order} of 7</p>
                </div>
              )}
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="subStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Update Status To</FormLabel>
                    <Select 
                      onValueChange={(value: ContractRenewalSubStatus) => field.onChange(value)} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select sub-status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SUBSTATUS_OPTIONS
                          .sort((a, b) => a.order - b.order)
                          .map((option) => {
                            const Icon = option.icon;
                            return (
                              <SelectItem 
                                key={option.value} 
                                value={option.value}
                                className="py-3"
                              >
                                <div className="flex items-center gap-3 w-full">
                                  <Icon className="h-4 w-4 text-gray-600" />
                                  <div className="flex-1">
                                    <div className="font-medium">{option.label}</div>
                                    <div className="text-xs text-gray-500">{option.description}</div>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    Step {option.order}
                                  </Badge>
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

              {selectedSubStatusOption && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <selectedSubStatusOption.icon className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900">{selectedSubStatusOption.label}</span>
                    <Badge variant="outline" className="text-xs">
                      Step {selectedSubStatusOption.order} of 7
                    </Badge>
                  </div>
                  <p className="text-sm text-blue-800">{selectedSubStatusOption.description}</p>
                  
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-blue-600 mb-1">
                      <span>Progress</span>
                      <span>{Math.round((selectedSubStatusOption.order / 7) * 100)}%</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${(selectedSubStatusOption.order / 7) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <FormField
                control={form.control}
                name="comments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comments (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any relevant comments about this status update..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {canCompleteRenewal && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-900">Ready for Completion</h4>
                      <p className="text-sm text-amber-800 mt-1">
                        This contract is in the final processing stage. You can now complete the renewal process.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </Form>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            disabled={isSubmitting || isCompleting}
          >
            Cancel
          </Button>
          
          {canCompleteRenewal && (
            <Button
              type="button"
              onClick={handleCompleteRenewal}
              disabled={isSubmitting || isCompleting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isCompleting && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              Complete Renewal
            </Button>
          )}
          
          <Button
            type="submit"
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting || isCompleting}
          >
            {isSubmitting && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
            Update Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}