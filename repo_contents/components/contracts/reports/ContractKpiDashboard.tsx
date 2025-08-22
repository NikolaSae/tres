// /components/contracts/reports/ContractKpiDashboard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'; // Shadcn UI Card
import { Skeleton } from '@/components/ui/skeleton'; // Shadcn UI Skeleton
import { useContracts } from '@/hooks/use-contracts'; // Hook za dohvatanje ugovora (već postoji)
import { useExpiringContracts } from '@/hooks/use-expiring-contracts'; // Hook za istekle ugovore (već postoji)
import { useContractReminders } from '@/hooks/use-contract-reminders'; // Hook za podsetnike (kreirali smo)
import { calculateTotalPlatformRevenue, calculateContractRevenue } from '@/lib/contracts/revenue-calculator'; // Utility za kalkulaciju prihoda (kreirali smo)
import { ContractStatus, ContractType } from '@prisma/client'; // Prisma enumi
import { getContractStatusLabel } from '@/lib/types/contract-status'; // Utility za labele statusa (kreirali smo)

// Import grafikona (kreirali smo ili već postoje)
import { ExpiryTimelineChart } from '@/components/contracts/charts/ExpiryTimelineChart'; // Postoji na vašoj listi
import { ContractTypeDistribution } from '@/components/contracts/charts/ContractTypeDistribution'; // Kreirali smo
import { RevenueProjection } from '@/components/contracts/charts/RevenueProjection'; // Kreirali smo

// Tip za sumarne KPI podatke
interface ContractSummaryKpis {
    totalContracts: number;
    activeContracts: number;
    expiredContracts: number;
    pendingContracts: number;
    renewalInProgressContracts: number;
    expiringSoonContracts: number; // Dohvaćeno posebnim hookom/API-jem
    totalReminders: number; // Ukupan broj podsetnika (možda samo nepregledanih?)
    outstandingReminders: number; // Broj nepregledanih/dospelih podsetnika
    // Možete dodati i druge sumarne KPI-jeve
}

/**
 * Komponenta KPI dashboarda za ugovore.
 * Dohvata relevantne podatke i prikazuje sumarne KPI-jeve i grafikone.
 */
export function ContractKpiDashboard() {
    // 1. Dohvatanje podataka koristeći hookove i utility funkcije
    // Možete dohvatiti sve ugovore i filtrirati ih klijentski,
    // ili koristiti specifične hookove/API rute za određene setove podataka.
    // Koristićemo kombinaciju hookova i direktnih poziva utility-ja/API-ja ako je potrebno.

    // Dohvatanje svih ugovora za sumarne brojeve i distribuciju tipova
    const { filteredContracts: allContracts, loading: loadingContracts, error: contractsError } = useContracts({
        fetchOnMount: true, // Dohvati podatke pri montiranju
        limit: undefined, // Dohvati sve
        filters: {} // Bez početnih filtera, dohvati sve
    });

    // Dohvatanje ugovora kojima ističe rok (koristimo postojeći hook, ako postoji /api/contracts/expiring ga koristi)
    // Pretpostavljamo da useExpiringContracts hook radi sa /api/contracts/expiring
    const { contracts: expiringContracts, loading: loadingExpiring, error: expiringError } = useExpiringContracts();


    // Dohvatanje podsetnika (ovaj hook je za specifičan ugovor, možda nam treba API ruta za sve podsetnike?)
    // Ako ne postoji API ruta za sve podsetnike, moraćemo da je dodamo ili da dohvatimo sve ugovore i njihove podsetnike.
    // Za sada, pretpostavljamo da ćemo morati da dohvatom svih ugovora dobijemo i count podsetnika.
    // Alternativa je novi hook/API ruta za sve podsetnike.

    // --- KPI Kalkulacije ---
    const [summaryKpis, setSummaryKpis] = useState<ContractSummaryKpis | null>(null);
    const [revenueData, setRevenueData] = useState<RevenueProjectionDataPoint[]>([]);
    const [loadingKpis, setLoadingKpis] = useState(true); // Stanje za sve KPI kalkulacije
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
                const pending = allContracts.filter(c => c.status === ContractStatus.PENDING).length;
                const renewal = allContracts.filter(c => c.status === ContractStatus.RENEWAL_IN_PROGRESS).length;
                // Broj expiringSoon dolazi iz posebnog hooka/liste
                 const expiringSoon = expiringContracts.length; // Koristimo podatke iz useExpiringContracts hooka

                 // Kalkulacija ukupnog broja podsetnika i nepregledanih podsetnika
                 // Ovo je komplikovano ako reminders count nije uključen u allContracts query ili ako nemamo hook/API za sve podsetnike.
                 // Ako _count.reminders postoji na Contract modelu iz useContracts hooka:
                 const totalReminders = allContracts.reduce((sum, contract) => sum + (contract._count?.reminders || 0), 0);
                 // Broj nepregledanih podsetnika bi zahtevao dohvatanje svih podsetnika ili agregaciju na serveru.
                 // Pretpostavimo da postoji API /api/reminders?isAcknowledged=false
                 // const outstandingRemindersResponse = await fetch('/api/reminders?isAcknowledged=false');
                 // const outstandingRemindersData = await outstandingRemindersResponse.json();
                 // const outstandingReminders = outstandingRemindersData.length;
                 // Za sada, postavićemo placeholder:
                 const outstandingReminders = 0; // PLACEHOLDER: Implementirati dohvatanje/kalkulaciju


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
                // Ovo bi zahtevalo da calculateTotalPlatformRevenue podržava period i da se pozove više puta
                // za različite periode (npr. narednih 12 meseci).
                 // Primer za narednih 6 meseci:
                const projectionData: RevenueProjectionDataPoint[] = [];
                const now = new Date();
                for (let i = 0; i < 6; i++) {
                    const periodStart = startOfMonth(addMonths(now, i));
                    const periodEnd = endOfMonth(addMonths(now, i));
                     // Pozivamo utility funkciju za svaki period
                     const revenue = await calculateTotalPlatformRevenue(periodStart, periodEnd);
                     projectionData.push({
                         period: format(periodStart, 'MMM yyyy'), // Npr. "Apr 2025"
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

        // Pokreni kalkulaciju KPI-jeva kada se allContracts ili expiringContracts promene
        calculateKpis();

    }, [allContracts, expiringContracts]); // Zavisnosti za ponovnu kalkulaciju


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

    // Podaci za Expiring Timeline Chart (pretpostavljamo da prihvata listu ugovora)
    // ExpiryTimelineChart verovatno radi sa listom ugovora i sam renduje timeline.
    // Možda prihvata sve ugovore ili samo one kojima ističe rok.
    // Poslaćemo mu sve ugovore, a komponenta neka filtrira ako treba.
    const expiringTimelineData = allContracts; // Prosleđujemo sve ugovore

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
                 <Skeleton className="h-96" /> {/* Skeleton za grafikone */}
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
                        {/* Ikona */}
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summaryKpis?.totalContracts ?? 0}</div>
                         {/* <p className="text-xs text-muted-foreground">+20.1% from last month</p> */}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
                        {/* Ikona */}
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summaryKpis?.activeContracts ?? 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Expired Contracts</CardTitle>
                        {/* Ikona */}
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summaryKpis?.expiredContracts ?? 0}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
                        {/* Ikona */}
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summaryKpis?.expiringSoonContracts ?? 0}</div>
                         <p className="text-xs text-muted-foreground">{summaryKpis?.renewalInProgressContracts ?? 0} in Renewal</p> {/* Opciono dodati vezane KPIjeve */}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Contracts</CardTitle>
                        {/* Ikona */}
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summaryKpis?.pendingContracts ?? 0}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Outstanding Reminders</CardTitle>
                        {/* Ikona */}
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summaryKpis?.outstandingReminders ?? 0}</div>
                         <p className="text-xs text-muted-foreground">Total: {summaryKpis?.totalReminders ?? 0}</p>
                    </CardContent>
                </Card>
                {/* Dodajte ostale KPI kartice */}
            </div>

            {/* Grafikoni */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Grafikon Distribucije Tipova Ugovora */}
                <ContractTypeDistribution data={typeDistributionData} />

                {/* Grafikon Projekcije Prihoda */}
                 {/* Proveriti da li revenueData ima podatke pre prosleđivanja */}
                <RevenueProjection data={revenueData} />
            </div>

             {/* Grafikon Expiry Timeline */}
             <div className="grid grid-cols-1"> {/* Može biti u svom redu ili mreži */}
                 {/* Proveriti da li expiringTimelineData ima podatke pre prosleđivanja */}
                 <ExpiryTimelineChart contracts={expiringTimelineData || []} />
             </div>


        </div>
    );
}