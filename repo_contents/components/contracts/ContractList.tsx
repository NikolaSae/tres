// Path: /components/contracts/ContractsList.tsx
"use client";

import { memo, useMemo } from "react";
import { Contract } from "@/lib/types/contract-types";
import { ContractStatus } from "@prisma/client";
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
import { formatDate } from "@/lib/utils";
import { 
  Eye, 
  Edit, 
  FileText, 
  Calendar, 
  Users, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react";
import Link from "next/link";

interface ContractListProps {
  contracts: Contract[];
  serverTime: string;
}

// Status badge component
const StatusBadge = memo(({ status }: { status: ContractStatus }) => {
  const getStatusConfig = (status: ContractStatus) => {
    switch (status) {
      case ContractStatus.ACTIVE:
        return {
          variant: "default" as const,
          className: "bg-green-100 text-green-800 hover:bg-green-200",
          icon: CheckCircle,
          label: "Active"
        };
      case ContractStatus.DRAFT:
        return {
          variant: "secondary" as const,
          className: "bg-gray-100 text-gray-800 hover:bg-gray-200",
          icon: FileText,
          label: "Draft"
        };
      case ContractStatus.PENDING:
        return {
          variant: "outline" as const,
          className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300",
          icon: Clock,
          label: "Pending"
        };
      case ContractStatus.EXPIRED:
        return {
          variant: "destructive" as const,
          className: "bg-red-100 text-red-800 hover:bg-red-200",
          icon: XCircle,
          label: "Expired"
        };
      case ContractStatus.TERMINATED:
        return {
          variant: "outline" as const,
          className: "bg-gray-100 text-gray-600 hover:bg-gray-200",
          icon: XCircle,
          label: "Terminated"
        };
      default:
        return {
          variant: "outline" as const,
          className: "",
          icon: FileText,
          label: status
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`text-xs ${config.className}`}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
});

StatusBadge.displayName = "StatusBadge";

// Check if contract is expiring soon (within 30 days)
const isExpiringSoon = (endDate: Date, serverTime: string): boolean => {
  const now = new Date(serverTime);
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  return endDate <= thirtyDaysFromNow && endDate > now;
};

// Memoized ContractRow component to prevent unnecessary re-renders
const ContractRow = memo(({ contract, serverTime }: { 
  contract: Contract; 
  serverTime: string 
}) => {
  const partnerName = useMemo(() => 
    contract.provider?.name || 
    contract.humanitarianOrg?.name || 
    contract.parkingService?.name || 
    "N/A"
  , [contract.provider?.name, contract.humanitarianOrg?.name, contract.parkingService?.name]);

  const isExpiring = useMemo(() => 
    contract.endDate ? isExpiringSoon(new Date(contract.endDate), serverTime) : false
  , [contract.endDate, serverTime]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: 'RSD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell>
        <div className="space-y-1">
          <Link 
            href={`/contracts/${contract.id}`} 
            className="font-medium hover:underline text-primary line-clamp-1" 
            title={contract.name}
          >
            {contract.name}
          </Link>
          <div className="text-sm text-muted-foreground">
            #{contract.contractNumber}
          </div>
        </div>
      </TableCell>

      <TableCell>
        <div className="space-y-2">
          <Badge variant="outline" className="text-xs">
            {contract.type.replace(/_/g, ' ')}
          </Badge>
          <div>
            <StatusBadge status={contract.status} />
          </div>
        </div>
      </TableCell>

      <TableCell>
        <div className="space-y-1">
          <div className="flex items-center text-sm">
            <Calendar className="h-3 w-3 mr-1 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">Start:</span>
            <span className="ml-1 font-medium">
              {contract.startDate ? formatDate(contract.startDate) : 'N/A'}
            </span>
          </div>
          <div className="flex items-center text-sm">
            <Calendar className="h-3 w-3 mr-1 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">End:</span>
            <span className={`ml-1 font-medium ${isExpiring ? 'text-orange-600' : ''}`}>
              {contract.endDate ? formatDate(contract.endDate) : 'N/A'}
              {isExpiring && (
                <AlertTriangle className="h-3 w-3 ml-1 inline text-orange-500" />
              )}
            </span>
          </div>
        </div>
      </TableCell>

      <TableCell>
        <div className="flex items-center text-sm">
          <Users className="h-3 w-3 mr-1 text-muted-foreground flex-shrink-0" />
          <span className="font-medium truncate" title={partnerName}>
            {partnerName}
          </span>
        </div>
      </TableCell>

      <TableCell>
        <div className="space-y-1">
          {contract.totalValue && (
            <div className="flex items-center text-sm">
              <DollarSign className="h-3 w-3 mr-1 text-muted-foreground flex-shrink-0" />
              <span className="font-medium">
                {formatCurrency(contract.totalValue)}
              </span>
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            {contract._count?.services || 0} services
          </div>
        </div>
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/contracts/${contract.id}`}>
              <Eye className="h-4 w-4" />
              <span className="sr-only">View contract</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/contracts/${contract.id}/edit`}>
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit contract</span>
            </Link>
          </Button>
          {contract._count?.attachments && contract._count.attachments > 0 && (
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/contracts/${contract.id}/documents`}>
                <FileText className="h-4 w-4" />
                <span className="sr-only">View documents</span>
              </Link>
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
});

ContractRow.displayName = "ContractRow";

// Main ContractsList component
export const ContractsList = memo(({ contracts, serverTime }: ContractListProps) => {
  if (!contracts || contracts.length === 0) {
    return (
      <div className="border rounded-lg">
        <div className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No contracts found</h3>
          <p className="text-muted-foreground mb-4">
            There are no contracts matching your current filters.
          </p>
          <Button asChild>
            <Link href="/contracts/new">
              Create your first contract
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">Contract Details</TableHead>
            <TableHead className="font-semibold">Type & Status</TableHead>
            <TableHead className="font-semibold">Duration</TableHead>
            <TableHead className="font-semibold">Partner</TableHead>
            <TableHead className="font-semibold">Value & Services</TableHead>
            <TableHead className="font-semibold w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contracts.map((contract) => (
            <ContractRow 
              key={contract.id} 
              contract={contract} 
              serverTime={serverTime}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
});

ContractsList.displayName = "ContractsList";