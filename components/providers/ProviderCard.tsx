// components/providers/ProviderCard.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Check, X, RefreshCw, FileText, CircleCheck, CircleX, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

import { createLogEntry, CreateLogEntryInput } from "@/actions/log/createLogEntry";
import { LogActionType, LogStatus, LogEntityType } from "@prisma/client";

interface ProviderCardProps {
  provider: {
    id: string;
    name: string;
    contactName?: string | null;
    email?: string | null;
    phone?: string | null;
    isActive: boolean;
    imageUrl?: string | null;
    _count?: {
      contracts?: number;
      complaints?: number;
      vasServices?: number;
      bulkServices?: number;
    };
  };
  onStatusChange?: (id: string, isActive: boolean) => Promise<void>;
  onRenewContract?: (id: string) => Promise<void>;
  triggerLogRefresh: () => void;
  disabled?: boolean; // ✅ Dodaj disabled prop
}

export function ProviderCard({ 
  provider, 
  onStatusChange, 
  onRenewContract, 
  triggerLogRefresh,
  disabled = false 
}: ProviderCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [currentLogAction, setCurrentLogAction] = useState<LogActionType | null>(null);
  const [logSubject, setLogSubject] = useState("");
  const [logDescription, setLogDescription] = useState("");
  const [sendEmail, setSendEmail] = useState(false);
  const [isLogFinished, setIsLogFinished] = useState(false);
  const [isLogSubmitting, setIsLogSubmitting] = useState(false);

  // ✅ Combine all loading/disabled states
  const isActionDisabled = isLoading || isLogSubmitting || disabled;

  const handleStatusChange = async () => {
    if (!onStatusChange || isActionDisabled) return;

    setIsLoading(true);
    try {
      await onStatusChange(provider.id, !provider.isActive);
    } catch (error) {
      console.error("[STATUS_CHANGE_ERROR]", error);
      toast.error("Failed to change provider status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenewContract = async () => {
    if (!onRenewContract || isActionDisabled) return;

    setIsLoading(true);
    try {
      await onRenewContract(provider.id);
    } catch (error) {
      console.error("[RENEW_CONTRACT_ERROR]", error);
      toast.error("Failed to renew contract");
    } finally {
      setIsLoading(false);
    }
  };

  const openLogModal = (actionType: LogActionType) => {
    if (isActionDisabled) return;
    
    setCurrentLogAction(actionType);
    setLogSubject("");
    setLogDescription("");
    setSendEmail(false);
    setIsLogFinished(false);
    setIsLogModalOpen(true);
  };

  const handleCreateLog = async () => {
    if (!logSubject.trim()) {
      toast.error("Subject is required for the log entry");
      return;
    }
    if (currentLogAction === null) {
      toast.error("Log action type is missing");
      return;
    }

    setIsLogSubmitting(true);
    try {
      const logData: CreateLogEntryInput = {
        entityType: LogEntityType.PROVIDER,
        entityId: provider.id,
        action: currentLogAction,
        subject: logSubject,
        description: logDescription.trim() === '' ? null : logDescription,
        sendEmail: sendEmail,
        status: isLogFinished ? LogStatus.FINISHED : LogStatus.IN_PROGRESS,
        providerId: provider.id,
        parkingServiceId: null,
        bulkServiceId: null,
      };

      const result = await createLogEntry(logData);

      if (result.success) {
        toast.success("Log entry created successfully");
        setIsLogModalOpen(false);
        setCurrentLogAction(null);
        setLogSubject("");
        setLogDescription("");
        setSendEmail(false);
        setIsLogFinished(false);
        triggerLogRefresh();
      } else {
        toast.error(result.error || "Failed to create log entry");
      }
    } catch (error) {
      console.error("[CREATE_LOG_ERROR]", error);
      toast.error("An unexpected error occurred while creating the log entry");
    } finally {
      setIsLogSubmitting(false);
    }
  };

  return (
    <>
      <Card
        className={`h-full flex flex-col relative overflow-hidden transition-all duration-200 hover:shadow-lg ${
          isActionDisabled ? 'opacity-60' : ''
        }`}
        style={{
          backgroundImage: provider.imageUrl ? `url(${provider.imageUrl})` : 'none',
          backgroundSize: '100px 100px',
          backgroundPosition: 'bottom right',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* ✅ Opcioni overlay za bolju čitljivost */}
        {provider.imageUrl && (
          <div 
            className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/90 to-transparent dark:from-gray-900/95 dark:via-gray-900/90" 
            style={{ zIndex: 0 }}
          />
        )}

        {/* Content sa z-index iznad overlay-a */}
        <CardHeader className="pb-2 relative z-10">
          <div className="flex justify-between items-start gap-2">
            <Link 
              href={`/providers/${provider.id}`} 
              className="hover:underline flex-1 min-w-0"
            >
              <CardTitle className="text-lg font-semibold truncate">
                {provider.name}
              </CardTitle>
            </Link>
            
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* ✅ Quick action buttons */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openLogModal('ACTIVATION')}
                disabled={isActionDisabled}
                title="Log Activation"
                className="hover:bg-green-50 dark:hover:bg-green-900/20"
              >
                <CircleCheck className="h-4 w-4 text-green-600" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => openLogModal('DEACTIVATION')}
                disabled={isActionDisabled}
                title="Log Deactivation"
                className="hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <CircleX className="h-4 w-4 text-red-600" />
              </Button>

              {/* ✅ Dropdown menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    disabled={isActionDisabled}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MoreVertical className="h-4 w-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push(`/providers/${provider.id}`)}>
                    View details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push(`/providers/${provider.id}/edit`)}>
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleStatusChange} 
                    disabled={isActionDisabled}
                  >
                    {provider.isActive ? (
                      <>
                        <X className="mr-2 h-4 w-4" />
                        <span>Deactivate</span>
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        <span>Activate</span>
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleRenewContract} 
                    disabled={isActionDisabled}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    <span>Renew Contract</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 pb-2 relative z-10">
          <div className="space-y-2 text-sm">
            {/* ✅ Status Badge - ključno da koristi provider.isActive */}
            <div className="flex justify-between items-center">
              <Badge 
                variant={provider.isActive ? "default" : "destructive"} 
                className={
                  provider.isActive 
                    ? "bg-green-600 hover:bg-green-700" 
                    : "bg-red-600 hover:bg-red-700"
                }
              >
                {provider.isActive ? "Active" : "Inactive"}
              </Badge>
              
              {/* ✅ Loading indicator */}
              {isLoading && (
                <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-start gap-2">
                <span className="font-medium text-gray-600 dark:text-gray-400 min-w-[60px]">Contact:</span>
                <span className="flex-1 truncate" title={provider.contactName || "N/A"}>
                  {provider.contactName || "N/A"}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-medium text-gray-600 dark:text-gray-400 min-w-[60px]">Email:</span>
                <span className="flex-1 truncate" title={provider.email || "N/A"}>
                  {provider.email || "N/A"}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-medium text-gray-600 dark:text-gray-400 min-w-[60px]">Phone:</span>
                <span className="flex-1 truncate" title={provider.phone || "N/A"}>
                  {provider.phone || "N/A"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-2 border-t flex flex-wrap justify-between text-xs text-gray-500 dark:text-gray-400 gap-2 relative z-10">
          <div className="flex items-center gap-1">
            <span className="font-medium">Contracts:</span>
            <span>{provider._count?.contracts || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">Complaints:</span>
            <span>{provider._count?.complaints || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">VAS:</span>
            <span>{provider._count?.vasServices || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">Bulk:</span>
            <span>{provider._count?.bulkServices || 0}</span>
          </div>
        </CardFooter>
      </Card>

      {/* ✅ Log Creation Dialog */}
      <Dialog open={isLogModalOpen} onOpenChange={setIsLogModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Log for {provider.name}</DialogTitle>
            <DialogDescription>
              Record a log entry related to this provider.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Action</Label>
              <div className="col-span-3 font-medium">
                {currentLogAction === 'ACTIVATION' ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <CircleCheck className="h-4 w-4" /> Activation Log
                  </span>
                ) : (
                  <span className="text-red-600 flex items-center gap-1">
                    <CircleX className="h-4 w-4" /> Deactivation Log
                  </span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subject" className="text-right">
                Subject *
              </Label>
              <Input
                id="subject"
                value={logSubject}
                onChange={(e) => setLogSubject(e.target.value)}
                className="col-span-3"
                placeholder="Enter log subject..."
                required
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={logDescription}
                onChange={(e) => setLogDescription(e.target.value)}
                className="col-span-3"
                rows={4}
                placeholder="Enter log description (optional)..."
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sendEmail" className="text-right">Send Email</Label>
              <div className="col-span-3 flex items-center gap-2">
                <Checkbox
                  id="sendEmail"
                  checked={sendEmail}
                  onCheckedChange={(checked) => setSendEmail(!!checked)}
                />
                <span className="text-sm text-gray-600">Notify via email</span>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="logFinished" className="text-right">Mark as Finished</Label>
              <div className="col-span-3 flex items-center gap-2">
                <Checkbox
                  id="logFinished"
                  checked={isLogFinished}
                  onCheckedChange={(checked) => setIsLogFinished(!!checked)}
                />
                <span className="text-sm text-gray-600">Complete immediately</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsLogModalOpen(false)} 
              disabled={isLogSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateLog} 
              disabled={isLogSubmitting || !logSubject.trim()}
            >
              {isLogSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Create Log Entry
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}