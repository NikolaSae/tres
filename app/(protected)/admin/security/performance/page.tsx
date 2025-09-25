// app/(protected)/admin/security/performance/page.tsx
// Ova stranica će sada biti Client Component da bi podržala interaktivni odabir vremenskog opsega
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Importujte Client komponente
import PerformanceMetrics from "@/components/security/PerformanceMetrics"; // Default import
// Pretpostavljamo da su i ove komponente Client komponente koje koriste usePerformanceMetrics ili primaju podatke
import SystemResources from "@/components/security/SystemResources";
import APIResponseTimes from "@/components/security/APIResponseTimes";
import DatabasePerformance from "@/components/security/DatabasePerformance";

// Uklonjeni server-side importi za auth i redirect
// import { auth } from "@/auth";
// import { redirect } from "next/navigation";

import { Metadata } from "next"; // Metadata se i dalje definiše na serveru, ali ovde je samo tip
import { useEffect, useState } from "react"; // Ostavljeno jer je ovo Client Component
import { AlertTriangle, Cpu, Activity, Clock, HardDrive } from "lucide-react"; // Ikone za kartice

// Metadata se definiše u zasebnom metadata.ts fajlu ili unutar layout.tsx za Client komponente
// export const metadata: Metadata = {
//   title: 'Performance Monitoring | Admin',
//   description: 'Monitor system performance metrics and resource utilization',
// };

// Uklonjen PerformanceSummary interfejs jer se sumarni podaci sada izračunavaju u PerformanceMetrics komponenti
// interface PerformanceSummary {
//   totalRequests: number;
//   avgResponseTime: number | null;
//   errorRate: number | null;
//   avgCpuUsage: number | null;
//   avgMemoryUsage: number | null;
// }

// Uklonjena formatValue funkcija jer je sada u PerformanceMetrics komponenti
// const formatValue = (value: number | null, type: string) => { ... }


// Glavna Client Komponenta za stranicu
export default function PerformanceMonitoringPageClient() {
  // Server-side provera autorizacije se obavlja u middleware-u ili layout.tsx
  // Ako ova stranica zahteva ADMIN rolu, to bi trebalo da se rukuje pre nego što se ova komponenta renderuje.
  // Npr. u parent layout.tsx ili middleware.ts

  // Uklonjeno server-side dohvatanje sumarnih metrika
  // const defaultSummaryResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/security/performance/summary?timeRange=24h`, { cache: 'no-store' });
  // const initialSummary: PerformanceSummary = defaultSummaryResponse.ok ? await defaultSummaryResponse.json() : { totalRequests: 0, avgResponseTime: null, errorRate: null, avgCpuUsage: null, avgMemoryUsage: null };


  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Monitoring</h1>
          <p className="text-muted-foreground">
            Monitor system performance metrics and resource utilization
          </p>
        </div>
      </div>

      {/* Sumarne kartice su sada deo PerformanceMetrics komponente */}
      {/* <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"> ... </div> */}

      {/* Tabs za različite sekcije performansi */}
      <Tabs defaultValue="overview">
        <TabsList className="grid w-full md:w-auto grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="api">API Performance</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="resources">System Resources</TabsTrigger>
        </TabsList>

        {/* Tab Content - Overview */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* PerformanceMetrics komponenta sada dohvata i prikazuje podatke */}
          <PerformanceMetrics />
        </TabsContent>

        {/* Tab Content - API Performance */}
        <TabsContent value="api" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>API Response Times</CardTitle>
              <CardDescription>
                Performance metrics for API endpoints
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* APIResponseTimes komponenta - treba da koristi usePerformanceMetrics ili primi podatke */}
              <APIResponseTimes />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Content - Database */}
        <TabsContent value="database" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Database Performance</CardTitle>
              <CardDescription>
                Query execution times and database metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* DatabasePerformance komponenta - treba da koristi usePerformanceMetrics ili primi podatke */}
              <DatabasePerformance />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Content - System Resources */}
        <TabsContent value="resources" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>System Resources</CardTitle>
              <CardDescription>
                CPU, memory, and disk usage metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* SystemResources komponenta - treba da koristi usePerformanceMetrics ili primi podatke */}
              <SystemResources />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Preimenovana Server komponenta u Client komponentu
// export default async function PerformanceMonitoringPageServer() { ... }
