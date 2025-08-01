// /components/contracts/renewal-dialog.tsx
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Upload, FileText, X, Download, Calendar, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { ContractRenewalSubStatus } from "@/lib/types/contract-types";

const renewalSchema = z.object({
  subStatus: z.nativeEnum(ContractRenewalSubStatus),
  proposedStartDate: z.string().min(1, "Start date is required"),
  proposedEndDate: z.string().min(1, "End date is required"),
  proposedRevenue: z.number().min(0).max(100).optional(),
  comments: z.string().optional(),
  internalNotes: z.string().optional(),
  documentsReceived: z.boolean().default(false),
  legalApproved: z.boolean().default(false),
  financialApproved: z.boolean().default(false),
  technicalApproved: z.boolean().default(false),
  managementApproved: z.boolean().default(false),
  signatureReceived: z.boolean().default(false),
}).refine((data) => {
  const startDate = new Date(data.proposedStartDate);
  const endDate = new Date(data.proposedEndDate);
  return startDate < endDate;
}, {
  message: "End date must be after start date",
  path: ["proposedEndDate"],
});

type RenewalFormData = z.infer<typeof renewalSchema>;

interface RenewalDialogProps {
  contractId: string;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface RenewalData {
  id?: string;
  subStatus: ContractRenewalSubStatus;
  proposedStartDate: string;
  proposedEndDate: string;
  proposedRevenue?: number;
  comments?: string;
  internalNotes?: string;
  documentsReceived: boolean;
  legalApproved: boolean;
  financialApproved: boolean;
  technicalApproved: boolean;
  managementApproved: boolean;
  signatureReceived: boolean;
  attachments?: Array<{
    id: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    filePath: string;
    description?: string;
    uploadedAt: string;
    uploadedBy: {
      name: string;
      email: string;
    };
  }>;
  createdAt?: string;
  updatedAt?: string;
}

const SUB_STATUS_OPTIONS = [
  { value: ContractRenewalSubStatus.DOCUMENT_COLLECTION, label: "Document Collection" },
  { value: ContractRenewalSubStatus.LEGAL_REVIEW, label: "Legal Review" },
  { value: ContractRenewalSubStatus.FINANCIAL_APPROVAL, label: "Financial Approval" },
  { value: ContractRenewalSubStatus.TECHNICAL_REVIEW, label: "Technical Review" },
  { value: ContractRenewalSubStatus.MANAGEMENT_APPROVAL, label: "Management Approval" },
  { value: ContractRenewalSubStatus.AWAITING_SIGNATURE, label: "Awaiting Signature" },
  { value: ContractRenewalSubStatus.FINAL_PROCESSING, label: "Final Processing" },
];

export function RenewalDialog({ contractId, open, onClose, onSuccess }: RenewalDialogProps) {
  const [renewalData, setRenewalData] = useState<RenewalData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<RenewalFormData>({
    resolver: zodResolver(renewalSchema),
    defaultValues: {
      subStatus: ContractRenewalSubStatus.DOCUMENT_COLLECTION,
      proposedStartDate: "",
      proposedEndDate: "",
      documentsReceived: false,
      legalApproved: false,
      financialApproved: false,
      technicalApproved: false,
      managementApproved: false,
      signatureReceived: false,
      comments: "",
      internalNotes: "",
    },
  });

  useEffect(() => {
    if (open && contractId) {
      loadRenewalData();
    } else if (!open) {
      form.reset();
      setRenewalData(null);
      setError(null);
    }
  }, [open, contractId, form]);

  useEffect(() => {
    if (renewalData) {
      const startDate = renewalData.proposedStartDate.includes('T') 
        ? renewalData.proposedStartDate.split('T')[0]
        : renewalData.proposedStartDate;
      const endDate = renewalData.proposedEndDate.includes('T')
        ? renewalData.proposedEndDate.split('T')[0]
        : renewalData.proposedEndDate;

      form.reset({
        subStatus: renewalData.subStatus,
        proposedStartDate: startDate,
        proposedEndDate: endDate,
        proposedRevenue: renewalData.proposedRevenue,
        comments: renewalData.comments || '',
        internalNotes: renewalData.internalNotes || '',
        documentsReceived: renewalData.documentsReceived,
        legalApproved: renewalData.legalApproved,
        financialApproved: renewalData.financialApproved,
        technicalApproved: renewalData.technicalApproved,
        managementApproved: renewalData.managementApproved,
        signatureReceived: renewalData.signatureReceived,
      });
    }
  }, [renewalData, form]);

  const loadRenewalData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/contracts/${contractId}/renewal`);
      const data = await response.json();
      
      if (response.ok) {
        setRenewalData(data.renewal);
      } else if (response.status === 404) {
        setRenewalData(null);
      } else {
        throw new Error(data.error || 'Failed to load renewal data');
      }
    } catch (error) {
      console.error('Error loading renewal data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load renewal data');
      toast.error('Failed to load renewal data');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: RenewalFormData) => {
    if (!contractId) {
      toast.error('Contract ID is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      const url = `/api/contracts/${contractId}/renewal`;
      const method = renewalData?.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(renewalData?.id ? 'Renewal updated successfully' : 'Renewal created successfully');
        onSuccess?.();
        onClose();
      } else {
        throw new Error(result.error || 'Failed to save renewal');
      }
    } catch (error) {
      console.error('Error saving renewal:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save renewal';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      if (!['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
        toast.error(`${file.name}: Only PDF and DOCX files are allowed`);
        continue;
      }

      const uploadId = `${file.name}-${Date.now()}`;
      setUploadingFiles(prev => [...prev, uploadId]);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('description', `Document for renewal process`);

        const response = await fetch(`/api/contracts/${contractId}/renewal/attachments`, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          toast.success(`${file.name} uploaded successfully`);
          await loadRenewalData();
        } else {
          const error = await response.json();
          toast.error(error.message || `Failed to upload ${file.name}`);
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        toast.error(`Failed to upload ${file.name}`);
      } finally {
        setUploadingFiles(prev => prev.filter(id => id !== uploadId));
      }
    }

    event.target.value = '';
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      const response = await fetch(`/api/contracts/${contractId}/renewal/attachments/${attachmentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Attachment deleted successfully');
        await loadRenewalData();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to delete attachment');
      }
    } catch (error) {
      console.error('Error deleting attachment:', error);
      toast.error('Failed to delete attachment');
    }
  };

  const getSubStatusBadgeColor = (status: ContractRenewalSubStatus) => {
    const colors = {
      [ContractRenewalSubStatus.DOCUMENT_COLLECTION]: "bg-yellow-100 text-yellow-800 border-yellow-200",
      [ContractRenewalSubStatus.LEGAL_REVIEW]: "bg-purple-100 text-purple-800 border-purple-200",
      [ContractRenewalSubStatus.FINANCIAL_APPROVAL]: "bg-blue-100 text-blue-800 border-blue-200",
      [ContractRenewalSubStatus.TECHNICAL_REVIEW]: "bg-cyan-100 text-cyan-800 border-cyan-200",
      [ContractRenewalSubStatus.MANAGEMENT_APPROVAL]: "bg-pink-100 text-pink-800 border-pink-200",
      [ContractRenewalSubStatus.AWAITING_SIGNATURE]: "bg-indigo-100 text-indigo-800 border-indigo-200",
      [ContractRenewalSubStatus.FINAL_PROCESSING]: "bg-green-100 text-green-800 border-green-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {renewalData?.id ? 'Manage Contract Renewal' : 'Start Contract Renewal'}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {renewalData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Current Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge className={getSubStatusBadgeColor(renewalData.subStatus)}>
                      {renewalData.subStatus.replace(/_/g, ' ')}
                    </Badge>
                    {renewalData.updatedAt && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Last updated: {new Date(renewalData.updatedAt).toLocaleString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="subStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sub Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select sub status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SUB_STATUS_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="proposedStartDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Proposed Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="proposedEndDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Proposed End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="proposedRevenue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Proposed Revenue Percentage</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            placeholder="Enter percentage (0-100)"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="comments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Comments</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter any comments about the renewal..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="internalNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Internal Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter internal notes (not visible to client)..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Approval Checkboxes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Approval Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="documentsReceived"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-normal">
                              Documents Received
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="legalApproved"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-normal">
                              Legal Approved
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="financialApproved"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-normal">
                              Financial Approved
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="technicalApproved"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-normal">
                              Technical Approved
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="managementApproved"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-normal">
                              Management Approved
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="signatureReceived"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-normal">
                              Signature Received
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Separator />

              {/* File Attachments */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Document Attachments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* File Upload */}
                    <div className="flex items-center gap-4">
                      <Label htmlFor="file-upload" className="cursor-pointer">
                        <div className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-md hover:border-gray-400 transition-colors">
                          <Upload className="h-4 w-4" />
                          <span className="text-sm">Upload Documents</span>
                        </div>
                      </Label>
                      <Input
                        id="file-upload"
                        type="file"
                        multiple
                        accept=".pdf,.docx"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <span className="text-xs text-muted-foreground">
                        PDF and DOCX files only
                      </span>
                    </div>

                    {/* Upload Progress */}
                    {uploadingFiles.length > 0 && (
                      <div className="space-y-2">
                        {uploadingFiles.map((uploadId) => (
                          <div key={uploadId} className="flex items-center gap-2 text-sm text-blue-600">
                            <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
                            <span>Uploading {uploadId.split('-')[0]}...</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Existing Attachments */}
                    {renewalData?.attachments && renewalData.attachments.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Uploaded Documents</h4>
                        {renewalData.attachments.map((attachment) => (
                          <div key={attachment.id} className="flex items-center justify-between p-3 border rounded-md">
                            <div className="flex items-center gap-3">
                              <FileText className="h-4 w-4 text-gray-500" />
                              <div>
                                <p className="text-sm font-medium">{attachment.fileName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatFileSize(attachment.fileSize)} • 
                                  Uploaded {new Date(attachment.uploadedAt).toLocaleDateString()} by {attachment.uploadedBy.name}
                                </p>
                                {attachment.description && (
                                  <p className="text-xs text-muted-foreground mt-1">{attachment.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(`/api/contracts/${contractId}/renewal/attachments/${attachment.id}/download`, '_blank')}
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteAttachment(attachment.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {renewalData?.id ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    renewalData?.id ? 'Update Renewal' : 'Create Renewal'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}