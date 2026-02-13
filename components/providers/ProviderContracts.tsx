// components/providers/ProviderContracts.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Contract } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { FileText, Loader2 } from 'lucide-react';

interface ProviderContractsProps {
  providerId: string;
}

const ProviderContracts: React.FC<ProviderContractsProps> = ({ providerId }) => {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/providers/${providerId}/contracts`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch contracts');
        }
        
        const data = await response.json();
        setContracts(data);
      } catch (err) {
        console.error('Error fetching contracts:', err);
        setError(err instanceof Error ? err.message : 'Failed to load contracts');
      } finally {
        setLoading(false);
      }
    };

    if (providerId) {
      fetchContracts();
    }
  }, [providerId]);

  const handleCreateContract = () => {
    router.push(`/contracts/new?providerId=${providerId}`);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-destructive mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

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
          <Card 
            key={contract.id} 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push(`/contracts/${contract.id}`)}
          >
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