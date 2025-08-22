//components/parking-services/ParkingServiceContracts.tsx

"use client";

import React, { useState, useEffect } from "react";
import { useParkingServiceContracts } from "@/hooks/use-parking-service-contracts";
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
import { ContractStatus } from "@prisma/client"; // Assuming ContractStatus enum is available

// Define the expected structure of a contract item, including the operator relation
interface ContractItem {
  id: string;
  contractNumber: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: ContractStatus; // Use the enum type
  revenuePercentage: number;
  isRevenueSharing: boolean; // Assuming this field exists to determine if operatorRevenue is relevant
  operatorRevenue?: number | null; // Include operator revenue
  operator?: { // Include operator relation details
    id: string;
    name: string;
  } | null;
}


interface ParkingServiceContractsProps {
  parkingServiceId: string;
}

export default function ParkingServiceContracts({ parkingServiceId }: ParkingServiceContractsProps) {
  // Assuming useParkingServiceContracts now returns contracts with the operator relation included
  const { contracts, isLoading, error, refreshContracts } = useParkingServiceContracts(parkingServiceId);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshContracts();
    // Add a small delay to make the loading indicator visible, even if fetch is fast
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
            <Button variant="outline" onClick={refreshContracts} className="mt-4">
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
        description="This parking service doesn't have any associated contracts yet."
        // Assuming EmptyState can take action props for a button
        // actionLabel="Refresh"
        // actionOnClick={handleRefresh}
      />
    );
  }

  // Helper function to render status badge
  const getStatusBadge = (status: ContractStatus) => {
    switch (status) {
      case "ACTIVE":
        return <Badge variant="default">Active</Badge>; // Use default variant for active
      case "EXPIRED":
        return <Badge variant="destructive">Expired</Badge>;
      case "PENDING":
        return <Badge variant="secondary">Pending</Badge>; // Use secondary or warning variant
      case "RENEWAL_IN_PROGRESS":
        return <Badge variant="outline">Renewal In Progress</Badge>; // Use outline variant
      case "TERMINATED": // Added TERMINATED status
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
              <TableHead>Operator</TableHead> {/* Added Operator column */}
              <TableHead>Platform Revenue %</TableHead>
              <TableHead>Operator Revenue %</TableHead> {/* Added Operator Revenue column */}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Ensure contracts is treated as an array */}
            {(contracts as ContractItem[]).map((contract) => (
              <TableRow key={contract.id}>
                <TableCell className="font-medium">{contract.contractNumber}</TableCell>
                <TableCell>{contract.name}</TableCell>
                <TableCell>{format(new Date(contract.startDate), "PPP")}</TableCell>
                <TableCell>{format(new Date(contract.endDate), "PPP")}</TableCell>
                <TableCell>{getStatusBadge(contract.status)}</TableCell>
                {/* Display Operator Name or "N/A" */}
                <TableCell>
                  {contract.operator ? (
                    <Link
                       href={`/operators/${contract.operator.id}`}
                       className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                       {contract.operator.name}
                    </Link>
                  ) : (
                    "N/A"
                  )}
                </TableCell>
                {/* Display Platform Revenue Percentage */}
                <TableCell>{contract.revenuePercentage}%</TableCell>
                {/* Display Operator Revenue Percentage if revenue sharing */}
                <TableCell>
                   {contract.isRevenueSharing && contract.operatorRevenue !== null && contract.operatorRevenue !== undefined ? (
                     `${contract.operatorRevenue}%`
                   ) : (
                     contract.isRevenueSharing ? "N/A" : "-" // Show N/A if revenue sharing but data missing, else "-"
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
