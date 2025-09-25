// components/providers/ProviderCard.tsx
"use client";

import React, { useState, useEffect } from "react"; // Import useEffect for logging
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
    imageUrl?: string | null; // Dodano imageUrl polje
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
}

export function ProviderCard({ provider, onStatusChange, onRenewContract, triggerLogRefresh }: ProviderCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [currentLogAction, setCurrentLogAction] = useState<LogActionType | null>(null);
  const [logSubject, setLogSubject] = useState("");
  const [logDescription, setLogDescription] = useState("");
  const [sendEmail, setSendEmail] = useState(false);
  const [isLogFinished, setIsLogFinished] = useState(false);
  const [isLogSubmitting, setIsLogSubmitting] = useState(false);

    // Add useEffect to log the imageUrl when the component mounts or provider changes
    useEffect(() => {
        // Dodata console.log izjava
        console.log(`Provider Card: Provider "${provider.name}", Image URL being used: "${provider.imageUrl}"`);
    }, [provider.name, provider.imageUrl]);


  const handleStatusChange = async () => {
    if (!onStatusChange) return;

    setIsLoading(true);
    try {
      await onStatusChange(provider.id, !provider.isActive);
    } catch (error) {
      console.error("Failed to change status:", error);
      toast.error("Failed to change provider status.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenewContract = async () => {
    if (!onRenewContract) return;

    setIsLoading(true);
    try {
      await onRenewContract(provider.id);
    } catch (error) {
      console.error("Failed to renew contract:", error);
      toast.error("Failed to renew contract.");
    } finally {
      setIsLoading(false);
    }
  };

  const openLogModal = (actionType: LogActionType) => {
      setCurrentLogAction(actionType);
      setLogSubject("");
      setLogDescription("");
      setSendEmail(false);
      setIsLogFinished(false);
      setIsLogModalOpen(true);
  };

  const handleCreateLog = async () => {
      if (!logSubject.trim()) {
          toast.error("Subject is required for the log entry.");
          return;
      }
      if (currentLogAction === null) {
          toast.error("Log action type is missing.");
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
              toast.success("Log entry created successfully.");
              setIsLogModalOpen(false);
              setCurrentLogAction(null);
              setLogSubject("");
              setLogDescription("");
              setSendEmail(false);
              setIsLogFinished(false);
              triggerLogRefresh();
          } else {
              toast.error(result.error || "Failed to create log entry.");
          }

      } catch (error) {
          console.error("Error creating log entry:", error);
          toast.error("An unexpected error occurred while creating the log entry.");
      } finally {
          setIsLogSubmitting(false);
      }
  };


  return (
    <Card
        className="h-full flex flex-col relative overflow-hidden" // Added relative and overflow-hidden for potential overlay
        style={{
            backgroundImage: provider.imageUrl ? `url(${provider.imageUrl})` : 'none',
            backgroundSize: '100px 100px',
            backgroundPosition: 'right',
            // Dodajte minimalnu visinu ako je potrebno da slika bude vidljiva i bez sadržaja
            miaHeight: '150px',
            backgroundRepeat: 'no-repeat',
            // Dodajte transform za rotaciju cele kartice
            // Promenite '5deg' na željeni ugao rotacije
            // transform: 'rotate(30deg)', // Primer: 0 stepeni rotacije (promenite ovo)
            // transform: `rotate(${rotationDegrees}deg)`, // Ako koristite prop
            transition: 'transform 0.5s ease-in-out', 
            // Dodajte minimalnu visinu ako je potrebno da slika bude vidljiva i bez sadržaja
            // minHeight: '150px',
        }}
    >
        {/* Opciono: Preklop (overlay) za bolju čitljivost teksta preko slike */}
        {provider.imageUrl && (
            <div className="absolute inset-0"></div> // Podesite boju i opacity po želji
        )}

        {/* Postavite sadržaj kartice iznad pozadine/overlaya */}
        <CardHeader className="pb-2 relative z-10"> {/* Dodajte relative z-10 */}
          <div className="flex justify-between items-start">
            <Link href={`/providers/${provider.id}`} className="hover:underline">
              <CardTitle className="text-lg font-semibold truncate">{provider.name}</CardTitle>
            </Link>
            <div className="flex items-center gap-1">
               <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openLogModal('ACTIVATION')}
                  disabled={isLoading || isLogSubmitting}
                  title="Log Activation"
              >
                  <CircleCheck className="h-4 w-4 text-green-600" />
              </Button>

               <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openLogModal('DEACTIVATION')}
                  disabled={isLoading || isLogSubmitting}
                  title="Log Deactivation"
              >
                  <CircleX className="h-4 w-4 text-red-600" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" disabled={isLoading || isLogSubmitting}>
                    <MoreVertical className="h-4 w-4" />
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
                  <DropdownMenuItem onClick={handleStatusChange} disabled={isLoading || isLogSubmitting}>
                    {provider.isActive ? (
                      <>
                        <X className="mr-2 h-4 w-4" />
                        <span>Deactivate Status</span>
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        <span>Activate Status</span>
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleRenewContract} disabled={isLoading || isLogSubmitting}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    <span>Renew Contract</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      {/* Postavite sadržaj kartice iznad pozadine/overlaya */}
      <CardContent className="flex-1 pb-2 relative z-10"> {/* Dodajte relative z-10 */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <Badge variant={provider.isActive ? "success" : "destructive"}>
              {provider.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          <div>
            <span className="font-medium">Contact:</span> {provider.contactName || "N/A"}
          </div>
          <div>
            <span className="font-medium">Email:</span> {provider.email || "N/A"}
          </div>
          <div>
            <span className="font-medium">Phone:</span> {provider.phone || "N/A"}
          </div>
        </div>
      </CardContent>
      {/* Postavite sadržaj kartice iznad pozadine/overlaya */}
      <CardFooter className="pt-2 border-t flex flex-wrap justify-between text-xs text-gray-500 gap-1 relative z-10"> {/* Dodajte relative z-10 */}
        <div>Contracts: {provider._count?.contracts || 0}</div>
        <div>Complaints: {provider._count?.complaints || 0}</div>
        <div>VAS: {provider._count?.vasServices || 0}</div>
        <div>Bulk: {provider._count?.bulkServices || 0}</div>
      </CardFooter>

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
                              <span className="text-green-600 flex items-center gap-1"><CircleCheck className="h-4 w-4" /> Activation Log</span>
                          ) : (
                              <span className="text-red-600 flex items-center gap-1"><CircleX className="h-4 w-4" /> Deactivation Log</span>
                          )}
                      </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="subject" className="text-right">
                          Subject
                      </Label>
                      <Input
                          id="subject"
                          value={logSubject}
                          onChange={(e) => setLogSubject(e.target.value)}
                          className="col-span-3"
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
                      />
                  </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                       <Label htmlFor="sendEmail" className="text-right">Send Email</Label>
                       <Checkbox
                           id="sendEmail"
                           checked={sendEmail}
                           onCheckedChange={(checked) => setSendEmail(!!checked)}
                       />
                   </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                       <Label htmlFor="logFinished" className="text-right">Mark as Finished</Label>
                       <Checkbox
                           id="logFinished"
                           checked={isLogFinished}
                           onCheckedChange={(checked) => setIsLogFinished(!!checked)}
                       />
                   </div>
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setIsLogModalOpen(false)} disabled={isLogSubmitting}>Cancel</Button>
                  <Button onClick={handleCreateLog} disabled={isLogSubmitting || !logSubject.trim()}>
                      {isLogSubmitting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                           <FileText className="mr-2 h-4 w-4" />
                      )}
                      Create Log Entry
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

    </Card>
  );
}