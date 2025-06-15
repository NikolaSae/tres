///components/contracts/ExpiryWarning.tsx


"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface ExpiryWarningProps {
  endDate: Date;
  contractId: string;
}

export function ExpiryWarning({ endDate, contractId }: ExpiryWarningProps) {
  const router = useRouter();
  
  const daysUntilExpiration = () => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  
  const days = daysUntilExpiration();
  
  return (
    <Alert variant="warning" className="bg-amber-50 border-amber-200">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Contract Expiring Soon</AlertTitle>
      <AlertDescription className="flex justify-between items-center">
        <span>This contract will expire in <strong>{days} days</strong>. Consider initiating the renewal process.</span>
        <Button 
          size="sm" 
          variant="outline"
          className="ml-4 border-amber-500 text-amber-700 hover:bg-amber-100"
          onClick={() => router.push(`/contracts/${contractId}/edit`)}
        >
          Start Renewal
        </Button>
      </AlertDescription>
    </Alert>
  );
}