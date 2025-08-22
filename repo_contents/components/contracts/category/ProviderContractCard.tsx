///components/contracts/category/ProviderContractCard.tsx


"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContractStatusBadge } from "@/components/contracts/ContractStatusBadge";
import { ExpiryWarning } from "@/components/contracts/ExpiryWarning";
import { formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { ContractStatus } from "@prisma/client";

interface Provider {
  id: string;
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
}

interface ProviderContractCardProps {
  id: string;
  name: string;
  contractNumber: string;
  status: ContractStatus;
  startDate: Date;
  endDate: Date;
  revenuePercentage: number;
  provider: Provider;
  servicesCount: number;
}

export function ProviderContractCard({
  id,
  name,
  contractNumber,
  status,
  startDate,
  endDate,
  revenuePercentage,
  provider,
  servicesCount,
}: ProviderContractCardProps) {
  const router = useRouter();
  
  const getDaysUntilExpiration = (endDate: Date) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  
  const daysUntilExpiration = getDaysUntilExpiration(endDate);
  const isExpiringSoon = daysUntilExpiration <= 30 && daysUntilExpiration > 0;
  const isExpired = daysUntilExpiration <= 0;

  return (
    <Card className={isExpiringSoon ? "border-amber-200" : ""}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Contract #{contractNumber}
            </p>
          </div>
          <ContractStatusBadge status={status} />
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Provider</p>
              <p className="text-sm">{provider.name}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium">Revenue Percentage</p>
              <p className="text-sm">{revenuePercentage}%</p>
            </div>
            
            <div>
              <p className="text-sm font-medium">Start Date</p>
              <p className="text-sm">{formatDate(startDate)}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium">End Date</p>
              <p className="text-sm">{formatDate(endDate)}</p>
            </div>
          </div>
          
          {provider.contactName && (
            <div className="text-sm">
              <p className="font-medium">Contact Information</p>
              <p>{provider.contactName}</p>
              {provider.email && <p>{provider.email}</p>}
              {provider.phone && <p>{provider.phone}</p>}
            </div>
          )}
          
          <div className="text-sm">
            <p className="font-medium">Services</p>
            <p>{servicesCount} service{servicesCount !== 1 ? "s" : ""} included in this contract</p>
          </div>
          
          {isExpiringSoon && !isExpired && (
            <ExpiryWarning daysRemaining={daysUntilExpiration} />
          )}
        </div>
      </CardContent>
      
      <CardFooter className="pt-4 flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => router.push(`/contracts/${id}`)}
        >
          View Details
        </Button>
        
        <Button 
          variant="default"
          onClick={() => router.push(`/contracts/${id}/edit`)}
        >
          Edit Contract
        </Button>
      </CardFooter>
    </Card>
  );
}