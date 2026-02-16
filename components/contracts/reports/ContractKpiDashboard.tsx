// /components/contracts/reports/ContractKpiDashboard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useContracts } from '@/hooks/use-contracts';
import { useExpiringContracts } from '@/hooks/use-expiring-contracts';
import { useContractReminders } from '@/hooks/use-contract-reminders';
import { calculateContractRevenue } from '@/lib/contracts/revenue-calculator';
import { ContractStatus, ContractType } from '@prisma/client';
import { getContractStatusLabel } from '@/lib/types/contract-status';
import { startOfMonth, endOfMonth, addMonths, format } from 'date-fns';

// Import grafikona
import { ExpiryTimelineChart } from '@/components/contracts/charts/ExpiryTimelineChart';
import { ContractTypeDistribution } from '@/components/contracts/charts/ContractTypeDistribution';
import { RevenueProjection } from '@/components/contracts/charts/RevenueProjection';

// Tip za podatke projekcije prihoda
interface RevenueProjectionDataPoint {
  period: string;
  revenue: number;
}

// Tip za sumarne KPI podatke
interface ContractSummaryKpis {
  totalContracts: number;
  activeContracts: number;
  expiredContracts: number;
  pendingContracts: number;
  renewalInProgressContracts: number;
  expiringSoonContracts: number;
  totalReminders: number;
  outstandingReminders: number;
}

/**
 * Komponenta KPI dashboarda za ugovore.
 * Dohvata relevantne podatke i prikazuje sumarne KPI-jeve i grafikone.
 */
export function ContractKpiDashboard() {
  // Dohvatanje svih ugovora za sumarne brojeve i distribuciju tipova
  const { filteredContracts: allContracts, loading: loadingContracts, error: contractsError } = useContracts({
    fetchOnMount: true,
    limit: undefined,
    filters: {}
  });

  // Dohvatanje ugovora kojima ističe rok
  const { contracts: expiringContracts, isLoading: loadingExpiring, error: expiringError } = useExpiringContracts();

  // --- KPI Kalkulacije ---
  const [summaryKpis, setSummaryKpis] = useState<ContractSummaryKpis | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueProjectionDataPoint[]>([]);
  const [loadingKpis, setLoadingKpis] = useState(true);
  const [kpiError, setKpiError] = useState<Error | null>(null);

  useEffect(() => {
    const calculateKpis = async () => {
      if (!allContracts || allContracts.length === 0) {
        setSummaryKpis(null);
        setRevenueData([]);
        setLoadingKpis(false);
        return;
      }

      setLoadingKpis(true);
      setKpiError(null);

      try {
        // Sumarni KPI-jevi
        const total = allContracts.length;
        const active = allContracts.filter(c => c.status === ContractStatus.ACTIVE).length;
        const expired = allContracts.filter(c => c.status === ContractStatus.EXPIRED).length;
        
        // ✅ FIXED: Uklonjen pogrešan comparison sa 'PENDING' string literal
        // Koristi samo ContractStatus.PENDING enum value
        const pending = allContracts.filter(c => c.status === ContractStatus.PENDING).length;
        
        const renewal = allContracts.filter(c => c.status === ContractStatus.RENEWAL_IN_PROGRESS).length;
        const expiringSoon = expiringContracts?.length || 0;

        // Kalkulacija ukupnog broja podsetnika
        const totalReminders = allContracts.reduce((sum, contract) => {
          return sum + ((contract as any)._count?.reminders || 0);
        }, 0);
        
        const outstandingReminders = 0; // PLACEHOLDER: Implementirati dohvatanje

        setSummaryKpis({
          totalContracts: total,
          activeContracts: active,
          expiredContracts: expired,
          pendingContracts: pending,
          renewalInProgressContracts: renewal,
          expiringSoonContracts: expiringSoon,
          totalReminders: totalReminders,
          outstandingReminders: outstandingReminders,
        });

        // Podaci za grafikon projekcije prihoda
        const projectionData: RevenueProjectionDataPoint[] = [];
        const now = new Date();
        
        for (let i = 0; i < 6; i++) {
          const periodStart = startOfMonth(addMonths(now, i));
          const periodEnd = endOfMonth(addMonths(now, i));
          
          // Jednostavna kalkulacija - suma svih aktivnih ugovora u periodu
          let revenue = 0;
          allContracts.forEach(contract => {
            if (contract.status === ContractStatus.ACTIVE) {
              // Ovde bi trebalo koristiti calculateContractRevenue sa parametrima
              // Za sada koristimo osnovnu logiku
              revenue += (contract as any).monthlyRevenue || 0;
            }
          });
          
          projectionData.push({
            period: format(periodStart, 'MMM yyyy'),
            revenue: revenue,
          });
        }

        setRevenueData(projectionData);

      } catch (err) {
        console.error("Error calculating KPIs:", err);
        setKpiError(err instanceof Error ? err : new Error('Failed to calculate KPIs.'));
      } finally {
        setLoadingKpis(false);
      }
    };

    calculateKpis();
  }, [allContracts, expiringContracts]);

  // Podaci za grafikon distribucije tipova
  const typeDistributionData = React.useMemo(() => {
    if (!allContracts) return [];
    const counts = allContracts.reduce((acc, contract) => {
      acc[contract.type] = (acc[contract.type] || 0) + 1;
      return acc;
    }, {} as Record<ContractType, number>);

    return Object.entries(counts).map(([type, count]) => ({
      type: type as ContractType,
      count: count
    }));
  }, [allContracts]);

  // Podaci za Expiry Timeline Chart
  const expiringTimelineData = allContracts || [];

  // Kombinovani loading state i error state
  const overallLoading = loadingContracts || loadingExpiring || loadingKpis;
  const overallError = contractsError || expiringError || kpiError;

  if (overallLoading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Contract KPI Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (overallError) {
    return (
      <div className="p-6 space-y-6 text-red-500">
        <h1 className="text-2xl font-bold tracking-tight">Contract KPI Dashboard</h1>
        <p>Error loading dashboard data: {overallError.message}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Contract KPI Dashboard</h1>

      {/* Sumarni KPI-jevi u karticama */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryKpis?.totalContracts ?? 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryKpis?.activeContracts ?? 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired Contracts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryKpis?.expiredContracts ?? 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryKpis?.expiringSoonContracts ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              {summaryKpis?.renewalInProgressContracts ?? 0} in Renewal
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Contracts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryKpis?.pendingContracts ?? 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Reminders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryKpis?.outstandingReminders ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Total: {summaryKpis?.totalReminders ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grafikoni */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ContractTypeDistribution data={typeDistributionData} />
        <RevenueProjection data={revenueData} />
      </div>

      {/* Grafikon Expiry Timeline */}
      <div className="grid grid-cols-1">
        <ExpiryTimelineChart data={expiringTimelineData} />
      </div>
    </div>
  );
}