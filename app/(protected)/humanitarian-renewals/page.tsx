// /app/(protected)/humanitarian-renewals/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarDays, FileText, AlertCircle, CheckCircle, Clock, Plus, Edit, Eye, Filter, Loader2, Trash2 } from 'lucide-react';
import { useHumanitarianRenewals, useRenewalStatistics } from '@/hooks/use-humanitarian-renewals';
import { useContracts } from '@/hooks/use-contracts';
import { useHumanitarianOrgs } from '@/hooks/use-humanitarian-orgs';
import { CreateHumanitarianRenewalInput, UpdateHumanitarianRenewalInput } from '@/schemas/humanitarian-renewal';
import { HumanitarianRenewalWithRelations } from '@/lib/types/humanitarian-renewal-types';
import { Pagination } from '@/components/ui/pagination';
import {
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from '@/components/ui/pagination';

const statusConfig = {
  DOCUMENT_COLLECTION: { label: 'Prikupljanje dokumenata', color: 'bg-orange-100 text-orange-800', icon: FileText },
  LEGAL_REVIEW: { label: 'Pravni pregled', color: 'bg-blue-100 text-blue-800', icon: Eye },
  FINANCIAL_APPROVAL: { label: 'Finansijska potvrda', color: 'bg-purple-100 text-purple-800', icon: CheckCircle },
  AWAITING_SIGNATURE: { label: 'Čeka potpis', color: 'bg-yellow-100 text-yellow-800', icon: Edit },
  FINAL_PROCESSING: { label: 'Završno procesiranje', color: 'bg-green-100 text-green-800', icon: Clock }
};

interface RenewalFormProps {
  renewal?: HumanitarianRenewalWithRelations | null;
  onSubmit: (formData: Partial<CreateHumanitarianRenewalInput & UpdateHumanitarianRenewalInput>) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const RenewalForm: React.FC<RenewalFormProps> = ({ renewal = null, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState<Partial<CreateHumanitarianRenewalInput & UpdateHumanitarianRenewalInput>>({
    contractId: renewal?.contract?.id || '',
    humanitarianOrgId: renewal?.humanitarianOrg?.id || '',
    proposedStartDate: renewal?.proposedStartDate ? new Date(renewal.proposedStartDate).toISOString().split('T')[0] : '',
    proposedEndDate: renewal?.proposedEndDate ? new Date(renewal.proposedEndDate).toISOString().split('T')[0] : '',
    proposedRevenue: renewal?.proposedRevenue ?? 0,
    subStatus: renewal?.subStatus || 'DOCUMENT_COLLECTION',
    documentsReceived: renewal?.documentsReceived || false,
    legalApproved: renewal?.legalApproved || false,
    financialApproved: renewal?.financialApproved || false,
    signatureReceived: renewal?.signatureReceived || false,
    notes: renewal?.notes || ''
  });

  const {
    contracts,
    loading: contractsLoading,
    error: contractsError,
    fetchContracts
  } = useContracts({
    fetchOnMount: true,
    limit: 1000
  });

  const {
    humanitarianOrgs,
    loading: orgsLoading,
    error: orgsError,
    refresh: fetchHumanitarianOrganizations
  } = useHumanitarianOrgs({}, { page: 1, limit: 1000 });

  useEffect(() => {
    if (!contracts && !contractsLoading && fetchContracts) {
      console.log('Ručno dohvatanje ugovora...');
      fetchContracts();
    }
  }, [contracts, contractsLoading, fetchContracts]);

  useEffect(() => {
    if (!humanitarianOrgs && !orgsLoading && fetchHumanitarianOrganizations) {
      console.log('Ručno dohvatanje organizacija...');
      fetchHumanitarianOrganizations();
    }
  }, [humanitarianOrgs, orgsLoading, fetchHumanitarianOrganizations]);

  useEffect(() => {
    console.log('RenewalForm - Contracts state:', {
      contracts: contracts?.length || 0,
      contractsLoading,
      contractsError
    });
  }, [contracts, contractsLoading, contractsError]);

  useEffect(() => {
    console.log('RenewalForm - Organizations state:', {
      humanitarianOrgs: humanitarianOrgs?.length || 0,
      orgsLoading,
      orgsError
    });
  }, [humanitarianOrgs, orgsLoading, orgsError]);

  useEffect(() => {
    if (renewal) {
      setFormData({
        contractId: renewal.contract?.id || '',
        humanitarianOrgId: renewal.humanitarianOrg?.id || '',
        proposedStartDate: renewal.proposedStartDate ? new Date(renewal.proposedStartDate).toISOString().split('T')[0] : '',
        proposedEndDate: renewal.proposedEndDate ? new Date(renewal.proposedEndDate).toISOString().split('T')[0] : '',
        proposedRevenue: renewal.proposedRevenue ?? 0,
        subStatus: renewal.subStatus || 'DOCUMENT_COLLECTION',
        documentsReceived: renewal.documentsReceived || false,
        legalApproved: renewal.legalApproved || false,
        financialApproved: renewal.financialApproved || false,
        signatureReceived: renewal.signatureReceived || false,
        notes: renewal.notes || ''
      });
    } else {
      setFormData({
        contractId: '',
        humanitarianOrgId: '',
        proposedStartDate: '',
        proposedEndDate: '',
        proposedRevenue: 0,
        subStatus: 'DOCUMENT_COLLECTION',
        documentsReceived: false,
        legalApproved: false,
        financialApproved: false,
        signatureReceived: false,
        notes: ''
      });
    }
  }, [renewal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="space-y-4">
      {contractsError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">Greška pri učitavanju ugovora: {contractsError.message || String(contractsError)}</p>
        </div>
      )}
      
      {orgsError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">Greška pri učitavanju organizacija: {orgsError.message || String(orgsError)}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contractId">Ugovor</Label>
          <Select
            value={formData.contractId}
            onValueChange={(value) => setFormData(prev => ({ ...prev, contractId: value }))}
            disabled={contractsLoading || isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder={
                contractsLoading 
                  ? "Učitavanje ugovora..." 
                  : contractsError 
                    ? "Greška pri učitavanju" 
                    : contracts?.length === 0 
                      ? "Nema dostupnih ugovora"
                      : "Izaberite ugovor"
              } />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Nijedan / Izaberite</SelectItem>
              {contracts?.map(contract => (
                <SelectItem key={contract.id} value={contract.id}>
                  {contract.contractNumber} - {contract.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">
            Učitano ugovora: {contracts?.length || 0} | Loading: {contractsLoading ? 'Da' : 'Ne'}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="humanitarianOrgId">Humanitarna organizacija</Label>
          <Select
            value={formData.humanitarianOrgId}
            onValueChange={(value) => setFormData(prev => ({ ...prev, humanitarianOrgId: value }))}
            disabled={orgsLoading || isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder={
                orgsLoading 
                  ? "Učitavanje organizacija..." 
                  : orgsError 
                    ? "Greška pri učitavanju" 
                    : humanitarianOrgs?.length === 0 
                      ? "Nema dostupnih organizacija"
                      : "Izaberite organizaciju"
              } />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Nijedna / Izaberite</SelectItem>
              {humanitarianOrgs?.map(org => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">
            Učitano organizacija: {humanitarianOrgs?.length || 0} | Loading: {orgsLoading ? 'Da' : 'Ne'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="proposedStartDate">Predloženi početak</Label>
          <Input
            type="date"
            value={formData.proposedStartDate}
            onChange={(e) => setFormData(prev => ({ ...prev, proposedStartDate: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="proposedEndDate">Predloženi kraj</Label>
          <Input
            type="date"
            value={formData.proposedEndDate}
            onChange={(e) => setFormData(prev => ({ ...prev, proposedEndDate: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="proposedRevenue">Predloženi procenat prihoda (%)</Label>
        <Input
          type="number"
          step="0.1"
          value={formData.proposedRevenue}
          onChange={(e) => setFormData(prev => ({ ...prev, proposedRevenue: parseFloat(e.target.value) }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subStatus">Status obnove</Label>
        <Select
          value={formData.subStatus || ''}
          onValueChange={(value) => setFormData(prev => ({ ...prev, subStatus: value as any }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Izaberite status" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(statusConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <Label>Status dokumenata</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="documentsReceived"
              checked={formData.documentsReceived}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, documentsReceived: !!checked }))}
            />
            <Label htmlFor="documentsReceived">Dokumenti primljeni</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="legalApproved"
              checked={formData.legalApproved}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, legalApproved: !!checked }))}
            />
            <Label htmlFor="legalApproved">Pravno odobreno</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="financialApproved"
              checked={formData.financialApproved}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, financialApproved: !!checked }))}
            />
            <Label htmlFor="financialApproved">Finansijski odobreno</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="signatureReceived"
              checked={formData.signatureReceived}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, signatureReceived: !!checked }))}
            />
            <Label htmlFor="signatureReceived">Potpis primljen</Label>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Napomene</Label>
        <Textarea
          value={formData.notes || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Dodatne napomene o obnovi ugovora..."
          rows={3}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Otkaži
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {renewal ? 'Ažuriraj' : 'Kreiraj'} obnovu
        </Button>
      </DialogFooter>
    </div>
  );
};

const HumanitarianRenewalsPage: React.FC = () => {
  const {
    renewals,
    loading: renewalsLoading,
    error: renewalsError,
    pagination,
    filters,
    actions: { fetchRenewals, createRenewal, updateRenewal, deleteRenewal, changePage, changeLimit, applyFilters, clearFilters }
  } = useHumanitarianRenewals({ autoFetch: true });

  const {
    statistics,
    loading: statisticsLoading,
    error: statisticsError,
    actions: { fetchStatistics }
  } = useRenewalStatistics();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRenewal, setSelectedRenewal] = useState<HumanitarianRenewalWithRelations | null>(null);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  const getProgressPercentage = (renewal: HumanitarianRenewalWithRelations) => {
    const steps = [
      renewal.documentsReceived,
      renewal.legalApproved,
      renewal.financialApproved,
      renewal.signatureReceived
    ];
    const completed = steps.filter(Boolean).length;
    return (completed / steps.length) * 100;
  };

  const handleCreateRenewal = async (formData: Partial<CreateHumanitarianRenewalInput>) => {
    const payload = {
      ...formData,
      contractId: formData.contractId === '' ? undefined : formData.contractId,
      humanitarianOrgId: formData.humanitarianOrgId === '' ? undefined : formData.humanitarianOrgId,
    } as CreateHumanitarianRenewalInput;
    const result = await createRenewal(payload);
    if (result.success) {
      setIsCreateDialogOpen(false);
      fetchStatistics();
    }
  };

  const handleEditRenewal = async (formData: Partial<UpdateHumanitarianRenewalInput>) => {
    if (!selectedRenewal) return;
    const payload = {
      ...formData,
      contractId: formData.contractId === '' ? undefined : formData.contractId,
      humanitarianOrgId: formData.humanitarianOrgId === '' ? undefined : formData.humanitarianOrgId,
    } as Omit<UpdateHumanitarianRenewalInput, 'id'>;
    const result = await updateRenewal(selectedRenewal.id, payload);
    if (result.success) {
      setIsEditDialogOpen(false);
      setSelectedRenewal(null);
    }
  };

  const handleDeleteRenewal = async (id: string) => {
    if (window.confirm('Da li ste sigurni da želite da obrišete ovu obnovu?')) {
      const result = await deleteRenewal(id);
      if (result.success) {
        fetchStatistics();
      }
    }
  };

  const handleFilterChange = (filterName: string, value: string) => {
    applyFilters({ ...filters, [filterName]: value === 'all' ? undefined : value });
  };

  const handlePageChange = (page: number) => {
    changePage(page);
  };

  const handleLimitChange = (limit: number) => {
    changeLimit(limit);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Obnova humanitarnih ugovora</h1>
          <p className="text-gray-600 mt-2">
            Praćenje i upravljanje procesom obnove ugovora sa humanitarnim organizacijama
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} key="create-dialog">
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova obnova
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Kreiranje nove obnove ugovora</DialogTitle>
              <DialogDescription>
                Inicijalizujte proces obnove postojećeg humanitarnog ugovora
              </DialogDescription>
            </DialogHeader>
            <RenewalForm
              onSubmit={handleCreateRenewal}
              onCancel={() => setIsCreateDialogOpen(false)}
              isLoading={renewalsLoading}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ukupno obnova</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statisticsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            ) : (
              <div className="text-2xl font-bold">{statistics?.totalRenewals ?? 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">U toku</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statisticsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            ) : (
              <div className="text-2xl font-bold">
                {statistics?.inProgress ?? 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Čeka potpis</CardTitle>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statisticsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            ) : (
              <div className="text-2xl font-bold">
                {statistics?.awaitingSignature ?? 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prosečan napredak</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statisticsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            ) : (
              <div className="text-2xl font-bold">
                {statistics?.averageProgress ? Math.round(statistics.averageProgress) : 0}%
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filteri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="statusFilter">Status obnove</Label>
              <Select value={filters.status || 'all'} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger id="statusFilter">
                  <SelectValue placeholder="Svi statusi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Svi statusi</SelectItem>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="organizationFilter">ID Organizacije</Label>
              <Input
                id="organizationFilter"
                placeholder="Unesite ID organizacije..."
                value={filters.organizationId || ''}
                onChange={(e) => handleFilterChange('organizationId', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Akcije</Label>
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full"
              >
                Obriši filtere
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista obnova</CardTitle>
          <CardDescription>
            Pregled svih obnova humanitarnih ugovora sa detaljnim statusom
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renewalsLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
              <p className="ml-3 text-gray-600">Učitavanje obnova...</p>
            </div>
          ) : renewalsError ? (
            <div className="text-center py-8 text-red-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-4" />
              <p>Greška pri dohvatanju obnova: {renewalsError}</p>
              <p className="text-sm">Molimo pokušajte ponovo kasnije.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {renewals.map((renewal) => {
                const StatusIcon = statusConfig[renewal.subStatus]?.icon || AlertCircle;
                const progress = getProgressPercentage(renewal);

                return (
                  <Card key={renewal.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div>
                              <h3 className="font-semibold text-lg">{renewal.contract?.contractNumber || 'N/A'}</h3>
                              <p className="text-sm text-gray-600">{renewal.contract?.name || 'N/A'}</p>
                            </div>
                            <Badge className={statusConfig[renewal.subStatus]?.color}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig[renewal.subStatus]?.label}
                            </Badge>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedRenewal(renewal);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Uredi
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteRenewal(renewal.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Obriši
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Organizacija</p>
                            <p className="font-medium">{renewal.humanitarianOrg?.name || 'N/A'}</p>
                            <p className="text-sm text-gray-600">{renewal.humanitarianOrg?.contactName || 'N/A'}</p>
                          </div>

                          <div>
                            <p className="text-sm font-medium text-gray-500">Predloženi period</p>
                            <p className="text-sm">
                              {renewal.proposedStartDate ? new Date(renewal.proposedStartDate).toLocaleDateString('sr-RS') : 'N/A'} -
                              {renewal.proposedEndDate ? new Date(renewal.proposedEndDate).toLocaleDateString('sr-RS') : 'N/A'}
                            </p>
                            <p className="text-sm text-gray-600">Prihod: {renewal.proposedRevenue}%</p>
                          </div>

                          <div>
                            <p className="text-sm font-medium text-gray-500">Poslednja izmena</p>
                            <p className="text-sm">{new Date(renewal.updatedAt).toLocaleDateString('sr-RS')}</p>
                            <p className="text-sm text-gray-600">{renewal.lastModifiedBy?.name || 'N/A'}</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <p className="text-sm font-medium text-gray-500">Napredak obnove</p>
                            <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                            <div className={`flex items-center space-x-1 ${renewal.documentsReceived ? 'text-green-600' : 'text-gray-400'}`}>
                              <CheckCircle className="w-3 h-3" />
                              <span>Dokumenti</span>
                            </div>
                            <div className={`flex items-center space-x-1 ${renewal.legalApproved ? 'text-green-600' : 'text-gray-400'}`}>
                              <CheckCircle className="w-3 h-3" />
                              <span>Pravni pregled</span>
                            </div>
                            <div className={`flex items-center space-x-1 ${renewal.financialApproved ? 'text-green-600' : 'text-gray-400'}`}>
                              <CheckCircle className="w-3 h-3" />
                              <span>Finansijska potvrda</span>
                            </div>
                            <div className={`flex items-center space-x-1 ${renewal.signatureReceived ? 'text-green-600' : 'text-gray-400'}`}>
                              <CheckCircle className="w-3 h-3" />
                              <span>Potpis</span>
                            </div>
                          </div>
                        </div>

                        {renewal.notes && (
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm font-medium text-gray-500 mb-1">Napomene</p>
                            <p className="text-sm text-gray-700">{renewal.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}

              {renewals.length === 0 && !renewalsLoading && !renewalsError && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Nema rezultata koji odgovaraju vašoj pretrazi.</p>
                  <p className="text-sm">Pokušajte sa različitim filterima ili dodajte novu obnovu.</p>
                </div>
              )}
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (pagination.page > 1) handlePageChange(pagination.page - 1);
                      }}
                      className={pagination.page === 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                  {[...Array(pagination.totalPages)].map((_, index) => (
                    <PaginationItem key={index}>
                      <PaginationLink
                        href="#"
                        isActive={pagination.page === index + 1}
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(index + 1);
                        }}
                      >
                        {index + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (pagination.page < pagination.totalPages) handlePageChange(pagination.page + 1);
                      }}
                      className={pagination.page === pagination.totalPages ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} key={selectedRenewal?.id || "edit-dialog"}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ažuriranje obnove ugovora</DialogTitle>
            <DialogDescription>
              Ažurirajte status i detalje obnove ugovora
            </DialogDescription>
          </DialogHeader>
          {selectedRenewal && (
            <RenewalForm
              renewal={selectedRenewal}
              onSubmit={handleEditRenewal}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedRenewal(null);
              }}
              isLoading={renewalsLoading}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HumanitarianRenewalsPage;