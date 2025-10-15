// app/(protected)/contracts/expiring/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CalendarDays, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Filter, 
  Loader2, 
  ArrowLeft,
  RefreshCw,
  Download,
  AlertTriangle,
  Calendar,
  Building,
  DollarSign
} from 'lucide-react';
import { ExpiryTimelineChart } from "@/components/contracts/charts/ExpiryTimelineChart";
import { EnhancedContractList } from "@/components/contracts/enhanced-contract-list";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Updated interfaces to match API response
interface ContractProvider {
  id: string;
  name: string;
}

interface ContractRenewal {
  id: string;
  contractId: string;
  subStatus: string;
  renewalStartDate?: string;
  proposedStartDate?: string;
  proposedEndDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface ExpiringContract {
  id: string;
  contractNumber: string;
  name: string;
  type: string; // PROVIDER, HUMANITARIAN, PARKING, BULK
  status: string; // ACTIVE, EXPIRED, RENEWAL_IN_PROGRESS, PENDING, TERMINATED, DRAFT
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  // Optional relations
  provider?: ContractProvider | null;
  humanitarianOrg?: ContractProvider | null;
  parkingService?: ContractProvider | null;
  renewals?: ContractRenewal[];
  daysToExpiry?: number;
}

interface ExpiryStatistics {
  totalExpiring: number;
  expiredCount: number;
  expiringIn30Days: number;
  expiringIn60Days: number;
  averageDaysToExpiry: number;
  contractsByType: {
    type: string;
    count: number;
    label: string;
  }[];
  renewalStats: {
    withRenewal: number;
    withoutRenewal: number;
  };
}

interface TimelineDataPoint {
  month: string;
  date: string;
  provider: number;
  humanitarian: number;
  parking: number;
  total: number;
  contracts: {
    id: string;
    contractNumber: string;
    organizationName: string;
    type: string;
    endDate: string;
    status: string;
    hasRenewal: boolean;
  }[];
}

// Real API hooks
const useExpiringContracts = (options: { autoFetch?: boolean }) => {
  const [contracts, setContracts] = useState<ExpiringContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50, // Increase limit for expiring contracts page
    total: 0,
    totalPages: 0
  });

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        expiringWithin: '60', // Get contracts expiring within 60 days
        includeExpired: 'true',
        ...filters
      });

      const response = await fetch(`/api/contracts?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Calculate days to expiry for each contract
      const contractsWithExpiry = data.contracts.map((contract: any) => ({
        ...contract,
        daysToExpiry: getDaysToExpiry(new Date(contract.endDate))
      }));
      
      setContracts(contractsWithExpiry);
      setPagination(prev => ({
        ...prev,
        total: data.total,
        totalPages: data.totalPages
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Neočekivana greška';
      setError(`Greška pri dohvatanju ugovora: ${errorMessage}`);
      toast.error('Greška pri dohvatanju ugovora');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  const applyFilters = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setFilters({});
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const changePage = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  useEffect(() => {
    if (options.autoFetch) {
      fetchContracts();
    }
  }, [fetchContracts, options.autoFetch]);

  return {
    contracts,
    loading,
    error,
    filters,
    pagination,
    actions: {
      fetchContracts,
      applyFilters,
      clearFilters,
      changePage
    }
  };
};

const useExpiryStatistics = () => {
  const [statistics, setStatistics] = useState<ExpiryStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/contracts/statistics/expiry');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setStatistics(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Neočekivana greška';
      setError(`Greška pri dohvatanju statistika: ${errorMessage}`);
      toast.error('Greška pri dohvatanju statistika');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    statistics,
    loading,
    error,
    actions: { fetchStatistics }
  };
};

const useTimelineData = () => {
  const [timelineData, setTimelineData] = useState<TimelineDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTimelineData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/contracts/timeline/expiry?monthsAhead=12&includeExpired=true');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setTimelineData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Neočekivana greška';
      setError(`Greška pri dohvatanju timeline podataka: ${errorMessage}`);
      console.error('Error fetching timeline data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    timelineData,
    loading,
    error,
    actions: { fetchTimelineData }
  };
};

// Helper functions
const getDaysToExpiry = (endDate: Date): number => {
  const today = new Date();
  const expiry = new Date(endDate);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getContractTypeLabel = (type: string): string => {
  const typeLabels: Record<string, string> = {
    'PROVIDER': 'Pružalac usluga',
    'HUMANITARIAN': 'Humanitarna pomoć',
    'PARKING': 'Parking servis',
    'BULK': 'Bulk ugovori',
    // Legacy support
    'HUMANITARIAN_AID': 'Humanitarna pomoć',
    'SERVICE_PROVIDER': 'Pružalac usluga',
    'PARKING_SERVICE': 'Parking servis'
  };
  return typeLabels[type] || type;
};

const ExpiringContractsPage: React.FC = () => {
  console.log("Rendering ExpiringContractsPage"); // Debug log
  const {
    contracts,
    loading: contractsLoading,
    error: contractsError,
    filters,
    pagination,
    actions: { fetchContracts, applyFilters, clearFilters, changePage }
  } = useExpiringContracts({ autoFetch: true });

  const {
    statistics,
    loading: statisticsLoading,
    error: statisticsError,
    actions: { fetchStatistics }
  } = useExpiryStatistics();

  const {
    timelineData,
    loading: timelineLoading,
    error: timelineError,
    actions: { fetchTimelineData }
  } = useTimelineData();

  const router = useRouter();

  useEffect(() => {
    console.log("Initial data fetch triggered"); // Debug log
    fetchStatistics();
    fetchTimelineData();
  }, [fetchStatistics, fetchTimelineData]);

  const handleFilterChange = (filterName: string, value: string) => {
    applyFilters({ ...filters, [filterName]: value === 'all' ? undefined : value });
  };

  const handleRefresh = () => {
    fetchContracts();
    fetchStatistics();
    fetchTimelineData();
  };

  const handleExport = async () => {
    console.log("Exporting contracts data");
    try {
      const queryParams = new URLSearchParams({
        expiringWithin: '60',
        includeExpired: 'true',
      });

      const response = await fetch(`/api/contracts/export?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Export request failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `expiring-contracts-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log("Export successful");
      toast.success('Ugovori uspešno izvezeni');
    } catch (error) {
      console.error("Export error:", error);
      toast.error('Greška pri izvozu ugovora');
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('sr-RS').format(num);
  };

  // Calculate server time for contract list
  const serverTime = new Date().toISOString();
  console.log("Server time for contracts:", serverTime); // Debug log
  console.log("Contracts data to pass to EnhancedContractList:", contracts); // Debug log
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="
              relative overflow-hidden
              inline-flex items-center justify-center gap-2
              px-4 py-2 rounded-lg
              text-white font-medium text-sm
              bg-gradient-to-r from-blue-900 via-blue-800 to-blue-600
              shadow-md shadow-blue-600/20
              hover:shadow-lg hover:shadow-blue-600/30
              hover:-translate-y-0.5
              active:translate-y-0
              transition-all duration-300 ease-in-out
              before:absolute before:inset-0
              before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent
              before:translate-x-[-200%]
              hover:before:translate-x-[200%]
              before:transition-transform before:duration-700
            "
          >
            <ArrowLeft className="h-4 w-4" />
            Nazad
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Ugovori koji ističu</h1>
            <p className="text-muted-foreground">
              Pregled ugovora koji ističu u narednih 60 dana
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={contractsLoading || statisticsLoading || timelineLoading}
            className="
              relative overflow-hidden
              inline-flex items-center justify-center gap-2
              px-4 py-2 rounded-lg
              text-white font-medium text-sm
              bg-gradient-to-r from-blue-900 via-blue-800 to-blue-600
              shadow-md shadow-blue-600/20
              hover:shadow-lg hover:shadow-blue-600/30
              hover:-translate-y-0.5
              active:translate-y-0
              transition-all duration-300 ease-in-out
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
              before:absolute before:inset-0
              before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent
              before:translate-x-[-200%]
              hover:before:translate-x-[200%]
              before:transition-transform before:duration-700
            "
          >
            <RefreshCw className={`h-4 w-4 ${(contractsLoading || statisticsLoading || timelineLoading) ? 'animate-spin' : ''}`} />
            Osveži
          </button>
          <button
            onClick={handleExport}
            className="
              relative overflow-hidden
              inline-flex items-center justify-center gap-2
              px-4 py-2 rounded-lg
              text-white font-medium text-sm
              bg-gradient-to-r from-blue-900 via-blue-800 to-blue-600
              shadow-md shadow-blue-600/20
              hover:shadow-lg hover:shadow-blue-600/30
              hover:-translate-y-0.5
              active:translate-y-0
              transition-all duration-300 ease-in-out
              before:absolute before:inset-0
              before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent
              before:translate-x-[-200%]
              hover:before:translate-x-[200%]
              before:transition-transform before:duration-700
            "
          >
            <Download className="h-4 w-4" />
            Izvezi
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ukupno ističe</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statisticsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                formatNumber(statistics?.totalExpiring || 0)
            )}
            </div>
            <p className="text-xs text-muted-foreground">
              U narednih 60 dana
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Već istekli</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statisticsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                formatNumber(statistics?.expiredCount || 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Potrebno je hitno obnoviti
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ističe u 30 dana</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statisticsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                formatNumber(statistics?.expiringIn30Days || 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Visoka prioritetna obnova
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prosečno dana</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statisticsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                statistics?.averageDaysToExpiry || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Do isteka ugovora
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Contract Types Breakdown */}
      {statistics && statistics.contractsByType.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Podela po tipovima ugovora
            </CardTitle>
            <CardDescription>
              Pregled ugovora koji ističu po tipovima
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {statistics.contractsByType.map((type) => (
                <div key={type.type} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{type.label}</p>
                    <p className="text-xs text-muted-foreground">{type.type}</p>
                  </div>
                  <Badge variant="secondary" className="font-bold">
                    {formatNumber(type.count)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Renewal Statistics */}
      {statistics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Status obnove
            </CardTitle>
            <CardDescription>
              Pregled procesa obnove za ugovore koji ističu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                <div>
                  <p className="text-sm font-medium text-green-800">Sa procesom obnove</p>
                  <p className="text-xs text-green-600">Obnova pokrenuta ili završena</p>
                </div>
                <Badge className="bg-green-100 text-green-800 border-green-200 font-bold">
                  {formatNumber(statistics.renewalStats.withRenewal)}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg bg-orange-50">
                <div>
                  <p className="text-sm font-medium text-orange-800">Bez procesa obnove</p>
                  <p className="text-xs text-orange-600">Potrebno pokrenuti obnovu</p>
                </div>
                <Badge className="bg-orange-100 text-orange-800 border-orange-200 font-bold">
                  {formatNumber(statistics.renewalStats.withoutRenewal)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Kalendar isteka ugovora
          </CardTitle>
          <CardDescription>
            Pregled ugovora koji ističu po mesecima (uključujući prethodne 3 meseca)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {timelineLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : timelineError ? (
            <div className="text-center py-8 text-muted-foreground">
              Greška pri učitavanju kalendara: {timelineError}
            </div>
          ) : (
            <ExpiryTimelineChart data={timelineData} />
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filteri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Tip ugovora</Label>
              <Select
                value={filters.type || 'all'}
                onValueChange={(value) => handleFilterChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Svi tipovi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Svi tipovi</SelectItem>
                  <SelectItem value="PROVIDER">Pružalac usluga</SelectItem>
                  <SelectItem value="HUMANITARIAN">Humanitarna pomoć</SelectItem>
                  <SelectItem value="PARKING">Parking servis</SelectItem>
                  <SelectItem value="BULK">Bulk ugovori</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Svi statusi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Svi statusi</SelectItem>
                  <SelectItem value="ACTIVE">Aktivan</SelectItem>
                  <SelectItem value="EXPIRED">Istekao</SelectItem>
                  <SelectItem value="RENEWAL_IN_PROGRESS">Obnova u toku</SelectItem>
                  <SelectItem value="PENDING">Na čekanju</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Period isteka</Label>
              <Select
                value={filters.expiryPeriod || 'all'}
                onValueChange={(value) => handleFilterChange('expiryPeriod', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Svi periodi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Svi periodi</SelectItem>
                  <SelectItem value="expired">Već istekli</SelectItem>
                  <SelectItem value="30">Ističe u 30 dana</SelectItem>
                  <SelectItem value="60">Ističe u 60 dana</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="
                  w-full
                  relative overflow-hidden
                  inline-flex items-center justify-center
                  px-4 py-2 rounded-lg
                  text-white font-medium text-sm
                  bg-gradient-to-r from-blue-900 via-blue-800 to-blue-600
                  shadow-md shadow-blue-600/20
                  hover:shadow-lg hover:shadow-blue-600/30
                  hover:-translate-y-0.5
                  active:translate-y-0
                  transition-all duration-300 ease-in-out
                  before:absolute before:inset-0
                  before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent
                  before:translate-x-[-200%]
                  hover:before:translate-x-[200%]
                  before:transition-transform before:duration-700
                "
              >
                Obriši filtere
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contracts List */}
      <Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <FileText className="h-5 w-5" />
      Lista ugovora ({contractsLoading ? '...' : formatNumber(contracts.length)})
    </CardTitle>
    <CardDescription>
      Detaljni pregled svih ugovora koji ističu u narednih 60 dana
    </CardDescription>
  </CardHeader>
  <CardContent>
    {contractsLoading ? (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    ) : contractsError ? (
      <div className="text-center py-8 text-red-500">
        {contractsError}
        <div className="mt-2">
          <button 
            onClick={fetchContracts}
            className="
              relative overflow-hidden
              inline-flex items-center justify-center
              px-4 py-2 rounded-lg
              text-white font-medium text-sm
              bg-gradient-to-r from-blue-900 via-blue-800 to-blue-600
              shadow-md shadow-blue-600/20
              hover:shadow-lg hover:shadow-blue-600/30
              hover:-translate-y-0.5
              active:translate-y-0
              transition-all duration-300 ease-in-out
              before:absolute before:inset-0
              before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent
              before:translate-x-[-200%]
              hover:before:translate-x-[200%]
              before:transition-transform before:duration-700
            "
          >
            Pokušaj ponovo
          </button>
        </div>
      </div>
    ) : contracts.length === 0 ? (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/50 rounded-md">
        <h3 className="text-lg font-medium">Nema pronađenih ugovora</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Nije pronađen nijedan ugovor koji ističe u narednih 60 dana.
        </p>
        <button 
          onClick={fetchContracts}
          className="
            mt-4
            relative overflow-hidden
            inline-flex items-center justify-center gap-2
            px-4 py-2 rounded-lg
            text-white font-medium text-sm
            bg-gradient-to-r from-blue-900 via-blue-800 to-blue-600
            shadow-md shadow-blue-600/20
            hover:shadow-lg hover:shadow-blue-600/30
            hover:-translate-y-0.5
            active:translate-y-0
            transition-all duration-300 ease-in-out
            before:absolute before:inset-0
            before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent
            before:translate-x-[-200%]
            hover:before:translate-x-[200%]
            before:transition-transform before:duration-700
          "
        >
          <RefreshCw className="h-4 w-4" />
          Osveži podatke
        </button>
      </div>
    ) : (
      <>
        {console.log('Rendering EnhancedContractList with contracts:', contracts)}
        <EnhancedContractList 
          contracts={contracts}
          serverTime={serverTime}
          onContractUpdate={fetchContracts}
        />
        </>
    )}
  </CardContent>
</Card>

      {/* Pagination */}
      {contracts.length > 0 && pagination.totalPages > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Stranica {pagination.page} od {pagination.totalPages} ({formatNumber(pagination.total)} ukupno ugovora)
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => changePage(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="
                    relative overflow-hidden
                    inline-flex items-center justify-center
                    px-4 py-2 rounded-lg
                    text-white font-medium text-sm
                    bg-gradient-to-r from-blue-900 via-blue-800 to-blue-600
                    shadow-md shadow-blue-600/20
                    hover:shadow-lg hover:shadow-blue-600/30
                    hover:-translate-y-0.5
                    active:translate-y-0
                    transition-all duration-300 ease-in-out
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
                    before:absolute before:inset-0
                    before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent
                    before:translate-x-[-200%]
                    hover:before:translate-x-[200%]
                    before:transition-transform before:duration-700
                  "
                >
                  Prethodna
                </button>
                <button
                  onClick={() => changePage(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="
                    relative overflow-hidden
                    inline-flex items-center justify-center
                    px-4 py-2 rounded-lg
                    text-white font-medium text-sm
                    bg-gradient-to-r from-blue-900 via-blue-800 to-blue-600
                    shadow-md shadow-blue-600/20
                    hover:shadow-lg hover:shadow-blue-600/30
                    hover:-translate-y-0.5
                    active:translate-y-0
                    transition-all duration-300 ease-in-out
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
                    before:absolute before:inset-0
                    before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent
                    before:translate-x-[-200%]
                    hover:before:translate-x-[200%]
                    before:transition-transform before:duration-700
                  "
                >
                  Sledeća
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExpiringContractsPage;