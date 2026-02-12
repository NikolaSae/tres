// components/providers/ProviderContracts.tsx
'use client';

import React from 'react';
import { Contract } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { FileText } from 'lucide-react';

interface ProviderContractsProps {
  providerId: string;
  contracts: Contract[];
}

const ProviderContracts: React.FC<ProviderContractsProps> = ({ providerId, contracts }) => {
  const router = useRouter();

  const handleCreateContract = () => {
    router.push(`/contracts/new?providerId=${providerId}`);
  };

  if (!contracts || contracts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No contracts found</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            This provider doesn't have any contracts yet.
          </p>
          <Button onClick={handleCreateContract} variant="outline">
            Create Contract
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Contracts ({contracts.length})</h3>
        <Button onClick={handleCreateContract}>
          Create New Contract
        </Button>
      </div>
      <div className="grid gap-4">
        {contracts.map((contract) => (
          <Card key={contract.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-base">{contract.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Contract Number:</span> {contract.contractNumber}
                </div>
                <div>
                  <span className="font-medium">Type:</span> {contract.type}
                </div>
                <div>
                  <span className="font-medium">Status:</span> {contract.status}
                </div>
                {contract.startDate && (
                  <div>
                    <span className="font-medium">Start Date:</span> {new Date(contract.startDate).toLocaleDateString()}
                  </div>
                )}
                {contract.endDate && (
                  <div>
                    <span className="font-medium">End Date:</span> {new Date(contract.endDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProviderContracts;