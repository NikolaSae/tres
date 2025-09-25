// components/contracts/enhanced-contract-list.tsx
"use client";
import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { MoreHorizontal, AlertTriangle, Calendar, FileText } from "lucide-react";
import { RenewalDialog } from "./renewal-dialog";
import { StatusChangeDialog } from "./status-change-dialog";

interface ContractProvider {
  id: string;
  name: string;
}

interface ContractRenewal {
  id: string;
  contractId: string;
  subStatus: string;
  renewalStartDate?: string | Date;
  proposedStartDate?: string | Date;
  proposedEndDate?: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface EnhancedContract {
  id: string;
  contractNumber: string;
  name: string;
  type: string;
  status: 'ACTIVE' | 'DRAFT' | 'EXPIRED' | 'PENDING' | 'TERMINATED' | 'RENEWAL_IN_PROGRESS';
  startDate: string | Date;
  endDate: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
  provider?: ContractProvider | null;
  humanitarianOrg?: ContractProvider | null;
  parkingService?: ContractProvider | null;
  renewals?: ContractRenewal[];
  daysToExpiry?: number;
}

interface EnhancedContractListProps {
  contracts: EnhancedContract[];
  serverTime: string;
  onContractUpdate?: () => void;
}

function safeDateFormat(date: string | Date | undefined): string {
  if (!date) {
    console.log('Date is undefined or null');
    return "-";
  }
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      console.error('Invalid date:', date);
      return "-";
    }
    const formatted = formatDate(dateObj.toISOString());
    console.log(`Formatted date: ${date} -> ${formatted}`);
    return formatted;
  } catch (error) {
    console.error('Date formatting error:', error, 'for date:', date);
    return "-";
  }
}

function getContractExpiryStatus(endDate: string | Date, serverTime: string) {
  try {
    console.log(`Calculating expiry status for endDate: ${endDate}, serverTime: ${serverTime}`);
    
    const contractEndDate = typeof endDate === 'string' ? new Date(endDate) : endDate;
    const currentDate = new Date(serverTime);
    
    if (isNaN(contractEndDate.getTime())) {
      console.error('Invalid contract end date:', endDate);
      return {
        isExpiringSoon: false,
        isRecentlyExpired: false,
        daysToExpiry: 0
      };
    }
    
    if (isNaN(currentDate.getTime())) {
      console.error('Invalid server time:', serverTime);
      return {
        isExpiringSoon: false,
        isRecentlyExpired: false,
        daysToExpiry: 0
      };
    }
    
    const diffInMs = contractEndDate.getTime() - currentDate.getTime();
    const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
    
    console.log(`Date difference: ${diffInDays} days`);
    
    return {
      isExpiringSoon: diffInDays <= 60 && diffInDays > 0,
      isRecentlyExpired: diffInDays < 0 && Math.abs(diffInDays) <= 60,
      daysToExpiry: diffInDays
    };
  } catch (error) {
    console.error('Error calculating expiry status:', error);
    return {
      isExpiringSoon: false,
      isRecentlyExpired: false,
      daysToExpiry: 0
    };
  }
}

function getContractTypeLabel(type: string): string {
  const typeLabels: Record<string, string> = {
    'PROVIDER': 'Pružalac usluga',
    'HUMANITARIAN': 'Humanitarna pomoć',
    'PARKING': 'Parking servis',
    'BULK': 'Bulk ugovori',
    'HUMANITARIAN_AID': 'Humanitarna pomoć',
    'SERVICE_PROVIDER': 'Pružalac usluga',
    'PARKING_SERVICE': 'Parking servis'
  };
  return typeLabels[type] || type.replace(/_/g, ' ');
}

function getStatusLabel(status: string): string {
  const statusLabels: Record<string, string> = {
    'ACTIVE': 'Aktivan',
    'DRAFT': 'Nacrt',
    'EXPIRED': 'Istekao',
    'PENDING': 'Na čekanju',
    'TERMINATED': 'Prekinut',
    'RENEWAL_IN_PROGRESS': 'Obnova u toku'
  };
  return statusLabels[status] || status.replace(/_/g, ' ');
}

function getSubStatusLabel(subStatus: string): string {
  const subStatusLabels: Record<string, string> = {
    'DOCUMENT_COLLECTION': 'Prikupljanje dokumenata',
    'LEGAL_REVIEW': 'Pravni pregled',
    'FINANCIAL_APPROVAL': 'Finansijsko odobrenje',
    'AWAITING_SIGNATURE': 'Čeka potpis',
    'FINAL_PROCESSING': 'Finalno procesiranje',
    'TECHNICAL_REVIEW': 'Tehnički pregled',
    'MANAGEMENT_APPROVAL': 'Odobrenje menadžmenta'
  };
  return subStatusLabels[subStatus] || subStatus.replace(/_/g, ' ');
}

function StatusBadge({ 
  status, 
  isExpiring = false,
  isExpired = false
}: { 
  status: string; 
  isExpiring?: boolean; 
  isExpired?: boolean;
}) {
  const getVariant = (status: string, isExpiring: boolean, isExpired: boolean) => {
    if (isExpiring && status === 'ACTIVE') {
      return "bg-orange-100 text-orange-800 border-orange-200";
    }
    if (isExpired && status === 'EXPIRED') {
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
    if (isExpiring && status === 'RENEWAL_IN_PROGRESS') {
      return "bg-orange-100 text-orange-800 border-orange-200";
    }
    
    const variants: Record<string, string> = {
      ACTIVE: "bg-green-100 text-green-800 border-green-200",
      DRAFT: "bg-gray-100 text-gray-800 border-gray-200",
      EXPIRED: "bg-red-100 text-red-800 border-red-200",
      PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
      TERMINATED: "bg-red-100 text-red-800 border-red-200",
      RENEWAL_IN_PROGRESS: "bg-blue-100 text-blue-800 border-blue-200",
    };
    
    return variants[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const badgeClass = getVariant(status, isExpiring, isExpired);
  
  return (
    <Badge className={`font-medium ${badgeClass}`}>
      {getStatusLabel(status)}
    </Badge>
  );
}

function SubStatusBadge({ subStatus }: { subStatus: string }) {
  const variants: Record<string, string> = {
    DOCUMENT_COLLECTION: "bg-yellow-100 text-yellow-800 border-yellow-200",
    LEGAL_REVIEW: "bg-purple-100 text-purple-800 border-purple-200",
    FINANCIAL_APPROVAL: "bg-blue-100 text-blue-800 border-blue-200",
    AWAITING_SIGNATURE: "bg-indigo-100 text-indigo-800 border-indigo-200",
    FINAL_PROCESSING: "bg-green-100 text-green-800 border-green-200",
    TECHNICAL_REVIEW: "bg-cyan-100 text-cyan-800 border-cyan-200",
    MANAGEMENT_APPROVAL: "bg-pink-100 text-pink-800 border-pink-200",
  };

  const badgeClass = variants[subStatus] || "bg-gray-100 text-gray-800 border-gray-200";
  
  return (
    <Badge className={`font-medium text-xs ${badgeClass}`}>
      {getSubStatusLabel(subStatus)}
    </Badge>
  );
}

function ContractActionsMenu({ 
  contract, 
  onRenewalAction, 
  onStatusChange 
}: {
  contract: EnhancedContract;
  onRenewalAction: () => void;
  onStatusChange: () => void;
}) {
  const canStartRenewal = contract.status === 'ACTIVE' || contract.status === 'PENDING';
  const hasActiveRenewal = contract.status === 'RENEWAL_IN_PROGRESS';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Otvori meni</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/contracts/${contract.id}`}>
            <FileText className="mr-2 h-4 w-4" />
            Prikaži detalje
          </Link>
        </DropdownMenuItem>
        
        {canStartRenewal && (
          <DropdownMenuItem onClick={onRenewalAction}>
            <Calendar className="mr-2 h-4 w-4" />
            Pokreni obnovu
          </DropdownMenuItem>
        )}
        
        {hasActiveRenewal && (
          <DropdownMenuItem onClick={onRenewalAction}>
            <Calendar className="mr-2 h-4 w-4" />
            Upravljaj obnovom
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem onClick={onStatusChange}>
          <AlertTriangle className="mr-2 h-4 w-4" />
          Promeni status
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function EnhancedContractList({ 
  contracts, 
  serverTime,
  onContractUpdate 
}: EnhancedContractListProps) {
  console.log("EnhancedContractList rendering");
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [selectedContract, setSelectedContract] = useState<EnhancedContract | null>(null);
  const [renewalDialogOpen, setRenewalDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  useEffect(() => {
    console.group("EnhancedContractList Debug Info");
    console.log("Server time received:", serverTime);
    console.log("Number of contracts received:", contracts.length);
    console.log("Sample contract data:", contracts.length > 0 ? contracts[0] : "No contracts");
    
    if (!serverTime || isNaN(new Date(serverTime).getTime())) {
      console.error("Invalid server time provided:", serverTime);
    } else {
      console.log("Parsed server time:", new Date(serverTime));
    }

    contracts.forEach((contract, index) => {
      const { isExpiringSoon, isRecentlyExpired, daysToExpiry } = getContractExpiryStatus(contract.endDate, serverTime);
      console.log(`Contract #${index + 1}: ${contract.name}`, {
        endDate: contract.endDate,
        daysToExpiry,
        isExpiringSoon,
        isRecentlyExpired,
        status: contract.status,
        type: contract.type
      });
    });
    console.groupEnd();
  }, [contracts, serverTime]);

  const handleRenewalAction = (contractId: string) => {
    console.log("Renewal action triggered for contract:", contractId);
    const contract = contracts.find(c => c.id === contractId);
    setSelectedContractId(contractId);
    setSelectedContract(contract || null);
    setRenewalDialogOpen(true);
  };

  const handleStatusChange = (contractId: string) => {
    console.log("Status change action triggered for contract:", contractId);
    const contract = contracts.find(c => c.id === contractId);
    setSelectedContractId(contractId);
    setSelectedContract(contract || null);
    setStatusDialogOpen(true);
  };

  const handleDialogClose = () => {
    console.log("Dialog closed, updating state");
    setRenewalDialogOpen(false);
    setStatusDialogOpen(false);
    setSelectedContractId(null);
    setSelectedContract(null);
    
    if (onContractUpdate) {
      console.log("Calling onContractUpdate callback");
      onContractUpdate();
    } else {
      console.log("No callback provided, reloading page");
      window.location.reload();
    }
  };

  if (!contracts || contracts.length === 0) {
    console.log("No contracts available, showing empty state");
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/50 rounded-md">
        <h3 className="text-lg font-medium">Nema pronađenih ugovora</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Kreirajte novi ugovor ili prilagodite filtere.
        </p>
      </div>
    );
  }

  try {
    return (
      <>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Naziv</TableHead>
                <TableHead>Broj ugovora</TableHead>
                <TableHead>Tip</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pod-status</TableHead>
                <TableHead>Datum početka</TableHead>
                <TableHead>Datum kraja</TableHead>
                <TableHead>Početak obnove</TableHead>
                <TableHead>Predloženi početak</TableHead>
                <TableHead>Predloženi kraj</TableHead>
                <TableHead>Partner</TableHead>
                <TableHead>Akcije</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((contract) => {
                console.log(`Rendering contract: ${contract.id} - ${contract.name}`);
                const { isExpiringSoon, isRecentlyExpired, daysToExpiry } = getContractExpiryStatus(contract.endDate, serverTime);
                const currentRenewal = contract.renewals && contract.renewals.length > 0 ? contract.renewals[0] : null;
                
                let rowClass = "";
                if (isExpiringSoon) rowClass = "hover:bg-gray-500";
                if (isRecentlyExpired) rowClass = "hover:bg-gray-300";
                
                const partnerName = contract.provider?.name || 
                                  contract.humanitarianOrg?.name || 
                                  contract.parkingService?.name || 
                                  "N/A";
                
                return (
                  <TableRow 
                    key={contract.id} 
                    className={rowClass}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Link href={`/contracts/${contract.id}`} className="hover:underline">
                          {contract.name}
                        </Link>
                        {(isExpiringSoon || isRecentlyExpired) && (
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{contract.contractNumber}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getContractTypeLabel(contract.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge 
                        status={contract.status} 
                        isExpiring={isExpiringSoon}
                        isExpired={isRecentlyExpired}
                      />
                    </TableCell>
                    <TableCell>
                      {contract.status === 'RENEWAL_IN_PROGRESS' && currentRenewal ? (
                        <SubStatusBadge subStatus={currentRenewal.subStatus} />
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>{safeDateFormat(contract.startDate)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {safeDateFormat(contract.endDate)}
                        {isExpiringSoon && (
                          <Badge variant="outline" className="text-xs text-orange-800 border-orange-200">
                            Uskoro ističe ({daysToExpiry} dana)
                          </Badge>
                        )}
                        {isRecentlyExpired && (
                          <Badge variant="outline" className="text-xs text-yellow-800 border-yellow-200">
                            Istekao ({Math.abs(daysToExpiry)} dana)
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {currentRenewal?.renewalStartDate 
                        ? safeDateFormat(currentRenewal.renewalStartDate) 
                        : <span className="text-muted-foreground text-sm">-</span>}
                    </TableCell>
                    <TableCell>
                      {currentRenewal?.proposedStartDate 
                        ? safeDateFormat(currentRenewal.proposedStartDate) 
                        : <span className="text-muted-foreground text-sm">-</span>}
                    </TableCell>
                    <TableCell>
                      {currentRenewal?.proposedEndDate 
                        ? safeDateFormat(currentRenewal.proposedEndDate) 
                        : <span className="text-muted-foreground text-sm">-</span>}
                    </TableCell>
                    <TableCell>{partnerName}</TableCell>
                    <TableCell>
                      <ContractActionsMenu 
                        contract={contract}
                        onRenewalAction={() => handleRenewalAction(contract.id)}
                        onStatusChange={() => handleStatusChange(contract.id)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {selectedContractId && (
          <RenewalDialog
            contractId={selectedContractId}
            open={renewalDialogOpen}
            onClose={handleDialogClose}
          />
        )}

        {selectedContractId && selectedContract && (
          <StatusChangeDialog
            contractId={selectedContractId}
            open={statusDialogOpen}
            onClose={handleDialogClose}
            currentStatus={selectedContract.status}
            contractName={selectedContract.name}
          />
        )}
      </>
    );
  } catch (error) {
    console.error("Error rendering EnhancedContractList:", error);
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-red-50 rounded-md">
        <h3 className="text-lg font-medium text-red-800">Došlo je do greške</h3>
        <p className="text-sm text-red-600 mt-1">
          Nije moguće prikazati listu ugovora. Pokušajte ponovo.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          {error instanceof Error ? error.message : String(error)}
        </p>
      </div>
    );
  }
}