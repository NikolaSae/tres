//components/contracts/ServiceLinkToContractModal.tsx

"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { getProviderContractsForLinking } from "@/actions/contracts/getProviderContractsForLinking";
import { linkServiceToContract } from "@/actions/contracts/linkServiceToContract";

interface ServiceLinkToContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceId: string;
  serviceName: string;
  providerId: string;
  onLinkSuccess: () => void; // Callback after successful linking
}

interface ContractOption {
  id: string;
  name: string;
  contractNumber: string;
}

export default function ServiceLinkToContractModal({
  isOpen,
  onClose,
  serviceId,
  serviceName,
  providerId,
  onLinkSuccess,
}: ServiceLinkToContractModalProps) {
  const [contracts, setContracts] = useState<ContractOption[]>([]);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [isLoadingContracts, setIsLoadingContracts] = useState(true);
  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && providerId) {
      const fetchContracts = async () => {
        setIsLoadingContracts(true);
        setError(null);
        try {
          const result = await getProviderContractsForLinking(providerId);
          if (result.success && result.data) {
            setContracts(result.data);
            if (result.data.length > 0) {
              setSelectedContractId(result.data[0].id); // Select first contract by default
            } else {
              setSelectedContractId(null);
            }
          } else {
            setError(result.error || "Failed to load contracts.");
          }
        } catch (err) {
          console.error("Error fetching contracts for linking:", err);
          setError("An unexpected error occurred while loading contracts.");
        } finally {
          setIsLoadingContracts(false);
        }
      };
      fetchContracts();
    }
  }, [isOpen, providerId]);

  const handleLink = async () => {
    if (!selectedContractId) {
      toast.error("Please select a contract to link.");
      return;
    }

    setIsLinking(true);
    setError(null);
    try {
      const result = await linkServiceToContract({
        serviceId: serviceId,
        contractId: selectedContractId,
      });

      if (result.success) {
        toast.success(`Service "${serviceName}" linked to contract successfully.`);
        onLinkSuccess(); // Trigger refresh in parent
        onClose();
      } else {
        setError(result.error || "Failed to link service to contract.");
        toast.error(result.error || "Failed to link service to contract.");
      }
    } catch (err) {
      console.error("Error linking service to contract:", err);
      setError("An unexpected error occurred during linking.");
      toast.error("An unexpected error occurred during linking.");
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Link Service to Existing Contract</DialogTitle>
          <DialogDescription>
            Link service "{serviceName}" to one of the existing contracts for this provider.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {error && (
            <div className="text-destructive text-sm text-center">{error}</div>
          )}
          {isLoadingContracts ? (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading contracts...</span>
            </div>
          ) : contracts.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              No existing contracts found for this provider.
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="contract-select">Select Contract</Label>
              <Select
                value={selectedContractId || ""}
                onValueChange={setSelectedContractId}
                disabled={isLinking || isLoadingContracts}
              >
                <SelectTrigger id="contract-select">
                  <SelectValue placeholder="Select a contract" />
                </SelectTrigger>
                <SelectContent>
                  {contracts.map((contract) => (
                    <SelectItem key={contract.id} value={contract.id}>
                      {contract.name} ({contract.contractNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLinking}>
            Cancel
          </Button>
          <Button onClick={handleLink} disabled={isLinking || !selectedContractId || contracts.length === 0}>
            {isLinking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Linking...
              </>
            ) : (
              "Link Service"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
