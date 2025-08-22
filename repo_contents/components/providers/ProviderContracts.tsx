//components/providers/ProviderContracts.tsx
"use client";

import React, { useState } from "react";
import { useProviderContracts } from "@/hooks/use-provider-contracts";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import EmptyState from "@/components/EmptyState";
import { ContractStatus } from "@prisma/client";

interface ProviderContractItem {
  id: string;
  contractNumber: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: ContractStatus;
  revenuePercentage: number;
  isRevenueSharing: boolean;
  operatorRevenue?: number | null;
  operator?: {
     id: string;
     name: string;
  } | null;
}

interface ProviderContractsProps {
  providerId: string;
}

export default function ProviderContracts({ providerId }: ProviderContractsProps) {
  const { contracts, isLoading, error, refreshContracts } = useProviderContracts(providerId);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshContracts();
    setTimeout(() => setRefreshing(false), 500);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-destructive">
            <p>{error}</p>
            <Button variant="outline" onClick={handleRefresh} className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!contracts || contracts.length === 0) {
    return (
      <EmptyState
        title="No Contracts Found"
        description="This provider doesn't have any associated contracts yet."
        actionLabel="Refresh"
        actionOnClick={handleRefresh}
      />
    );
  }

   const getStatusBadge = (status: ContractStatus) => {
     switch (status) {
       case "ACTIVE":
         return <Badge variant="default">Active</Badge>;
       case "EXPIRED":
         return <Badge variant="destructive">Expired</Badge>;
       case "PENDING":
         return <Badge variant="secondary">Pending</Badge>;
       case "RENEWAL_IN_PROGRESS":
         return <Badge variant="outline">Renewal In Progress</Badge>;
       case "TERMINATED":
          return <Badge variant="destructive">Terminated</Badge>;
       default:
         return <Badge variant="outline">{status}</Badge>;
     }
   };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Associated Contracts</h3>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing || isLoading}>
          {refreshing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contract Number</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Platform Revenue %</TableHead>
              <TableHead>Operator Revenue %</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(contracts as ProviderContractItem[]).map((contract) => (
              <TableRow key={contract.id}>
                <TableCell className="font-medium">{contract.contractNumber}</TableCell>
                <TableCell>{contract.name}</TableCell>
                <TableCell>{format(new Date(contract.startDate), "PPP")}</TableCell>
                <TableCell>{format(new Date(contract.endDate), "PPP")}</TableCell>
                <TableCell>{getStatusBadge(contract.status)}</TableCell>
                <TableCell>{contract.revenuePercentage}%</TableCell>
                 <TableCell>
                   {contract.isRevenueSharing && contract.operatorRevenue !== null && contract.operatorRevenue !== undefined ? (
                     `${contract.operatorRevenue}%`
                   ) : (
                     contract.isRevenueSharing ? "N/A" : "-"
                   )}
                 </TableCell>
                <TableCell className="text-right">
                  <Link href={`/contracts/${contract.id}`} passHref>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
