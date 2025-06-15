// components/operators/OperatorContracts.tsx


"use client";

import { useEffect, useState } from "react";
import { Contract } from "@prisma/client";
import { useRouter } from "next/navigation";
import { CalendarIcon, ExternalLink } from "lucide-react";
import { format } from "date-fns";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { getContractsByOperatorId } from "@/actions/operators";
import Link from "next/link";
import { formatCurrency } from "@/lib/formatters";

interface OperatorContractsProps {
  operatorId: string;
}

export function OperatorContracts({ operatorId }: OperatorContractsProps) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadContracts() {
      try {
        const data = await getContractsByOperatorId(operatorId);
        setContracts(data);
      } catch (error) {
        console.error("Error loading operator contracts:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadContracts();
  }, [operatorId]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "success";
      case "EXPIRED":
        return "destructive";
      case "PENDING":
        return "warning";
      case "RENEWAL_IN_PROGRESS":
        return "info";
      default:
        return "secondary";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Associated Contracts</span>
          <Badge variant="outline">
            {contracts.length} Contract{contracts.length !== 1 ? "s" : ""}
          </Badge>
        </CardTitle>
        <CardDescription>
          Contracts connected to this operator
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : contracts.length > 0 ? (
          <div className="space-y-4">
            {contracts.map((contract) => (
              <div
                key={contract.id}
                className="flex flex-col rounded-lg border p-4 transition-colors hover:bg-gray-50 sm:flex-row"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <h3 className="font-medium">{contract.name}</h3>
                    <Badge variant={getStatusBadgeColor(contract.status)}>
                      {contract.status.replace("_", " ")}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-500">
                    Contract #{contract.contractNumber}
                  </p>
                  
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                    <div className="flex items-center text-gray-500">
                      <CalendarIcon className="mr-1 h-3.5 w-3.5" />
                      <span>
                        {format(new Date(contract.startDate), "MMM d, yyyy")} - {format(new Date(contract.endDate), "MMM d, yyyy")}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-gray-500">
                      <span>Revenue: {formatCurrency(contract.revenuePercentage)}%</span>
                    </div>
                    
                    {contract.operatorRevenue && (
                      <div className="flex items-center text-gray-500">
                        <span>Operator Revenue: {formatCurrency(contract.operatorRevenue)}%</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 flex items-center justify-end gap-2 sm:mt-0 sm:ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <Link href={`/contracts/${contract.id}`}>
                      <ExternalLink className="mr-1 h-3.5 w-3.5" />
                      View
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-24 flex-col items-center justify-center rounded-lg border border-dashed text-center">
            <p className="text-sm text-gray-500">No contracts associated with this operator</p>
            <Button variant="link" asChild>
              <Link href="/contracts/new">Create a new contract</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}