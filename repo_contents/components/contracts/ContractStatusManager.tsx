// components/contracts/ContractStatusManager.tsx

"use client";

import React, { useState } from 'react';
import { ContractStatus } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, FileText, RefreshCw, Edit, Loader2 } from 'lucide-react';
import { useContracts } from '@/hooks/use-contracts';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Contract {
  id: string;
  name: string;
  contractNumber: string;
  type: 'HUMANITARIAN' | 'PROVIDER' | 'PARKING';
  status: ContractStatus;
  humanitarianOrg?: {
    id: string;
    name: string;
  } | null;
}

interface ContractStatusManagerProps {
  contract: Contract;
  onStatusUpdated?: () => void;
}

const statusConfig = {
  DRAFT: { label: 'Nacrt', color: 'bg-gray-100 text-gray-800', icon: FileText },
  ACTIVE: { label: 'Aktivan', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  EXPIRED: { label: 'Istekao', color: 'bg-red-100 text-red-800', icon: AlertCircle },
  TERMINATED: { label: 'Raskinut', color: 'bg-red-100 text-red-800', icon: AlertCircle },
  RENEWAL_IN_PROGRESS: { label: 'Obnova u toku', color: 'bg-blue-100 text-blue-800', icon: RefreshCw }
};

const statusTransitions: Record<ContractStatus, ContractStatus[]> = {
  DRAFT: ['ACTIVE'],
  ACTIVE: ['EXPIRED', 'TERMINATED', 'RENEWAL_IN_PROGRESS'],
  EXPIRED: ['RENEWAL_IN_PROGRESS', 'TERMINATED'],
  TERMINATED: [],
  RENEWAL_IN_PROGRESS: ['ACTIVE', 'TERMINATED', 'EXPIRED']
};

export const ContractStatusManager: React.FC<ContractStatusManagerProps> = ({ 
  contract, 
  onStatusUpdated 
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ContractStatus | ''>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { updateContractStatus } = useContracts();
  const router = useRouter();

  const availableStatuses = statusTransitions[contract.status] || [];
  const currentStatusConfig = statusConfig[contract.status];
  const CurrentStatusIcon = currentStatusConfig.icon;

  const handleStatusChange = async () => {
    if (!selectedStatus) return;

    setIsSubmitting(true);
    try {
      const result = await updateContractStatus(contract.id, {
        status: selectedStatus,
        notes: notes.trim() || undefined
      });

      if (result.success) {
        // Prikaži obaveštenje o uspešnoj izmeni
        toast.success('Status ugovora je uspešno ažuriran');

        // Ako je kreiran renewal, prikaži dodatno obaveštenje
        if (result.renewalId && selectedStatus === 'RENEWAL_IN_PROGRESS') {
          toast.success('Automatski je kreiran proces obnove ugovora', {
            action: {
              label: 'Prikaži',
              onClick: () => router.push(`/humanitarian-renewals`)
            }
          });
        }

        // Reset forme
        setSelectedStatus('');
        setNotes('');
        setIsDialogOpen(false);

        // Pozovi callback funkciju
        onStatusUpdated?.();
      } else {
        toast.error(result.error || 'Greška pri ažuriranju statusa');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Neočekivana greška pri ažuriranju statusa');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusChangeMessage = (newStatus: ContractStatus) => {
    if (newStatus === 'RENEWAL_IN_PROGRESS' && contract.type === 'HUMANITARIAN') {
      return 'Postavljanjem ovog statusa će se automatski kreirati proces obnove ugovora u sistemu za praćenje obnova humanitarnih ugovora.';
    }
    return '';
  };

  return (
    <div className="flex items-center space-x-2">
      <Badge className={currentStatusConfig.color}>
        <CurrentStatusIcon className="w-3 h-3 mr-1" />
        {currentStatusConfig.label}
      </Badge>

      {availableStatuses.length > 0 && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Edit className="w-4 h-4 mr-1" />
              Promeni status
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Promena statusa ugovora</DialogTitle>
              <DialogDescription>
                Menjanje statusa ugovora: {contract.contractNumber} - {contract.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Novi status</Label>
                <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as ContractStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Izaberite novi status" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStatuses.map((status) => {
                      const config = statusConfig[status];
                      const StatusIcon = config.icon;
                      return (
                        <SelectItem key={status} value={status}>
                          <div className="flex items-center">
                            <StatusIcon className="w-4 h-4 mr-2" />
                            {config.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {selectedStatus && getStatusChangeMessage(selectedStatus) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-700">
                      {getStatusChangeMessage(selectedStatus)}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Napomene (opciono)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Dodatne napomene o promeni statusa..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Otkaži
              </Button>
              <Button 
                onClick={handleStatusChange}
                disabled={!selectedStatus || isSubmitting}
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Ažuriraj status
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};