// components/security/PerformanceMetrics.tsx
"use client";

import React, { useState } from 'react';
import { usePerformanceMetrics, TimeRange } from "@/hooks/use-performance-metrics"; // Import hook and TimeRange type
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from 'date-fns'; // Za formatiranje datuma/vremena
// Importovane ikone koje se koriste u sumarnim karticama
import { AlertTriangle, Cpu, Activity, Clock, HardDrive } from "lucide-react";


// Helper funkcija za formatiranje vrednosti (možete je premestiti u lib/utils ako je koristite na više mesta)
const formatValue = (value: number | null, type: string) => {
    if (value === null) return "--";
    switch(type) {
        case "time": return `${value.toFixed(2)}ms`;
        case "percentage": return `${value.toFixed(2)}%`;
        case "count": return value.toLocaleString();
        case "memory": // Pretpostavljamo da je vrednost u bajtima i konvertujemo u GB
             if (value === 0) return "0 GB";
             // Pretpostavljamo da je ulaz u bajtima, konvertujemo u GB
             const gb = value / (1024 * 1024 * 1024);
             // Ako je vrednost manja od 1GB, prikažite u MB
             if (gb < 1) {
                 const mb = value / (1024 * 1024);
                 return `${mb.toFixed(2)} MB`;
             }
             return `${gb.toFixed(2)} GB`;
        default: return value.toString();
    }
}


const PerformanceMetrics: React.FC = () => {
  // State za odabrani vremenski opseg na klijentskoj strani
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>("24h");

  // Koristimo hook za dohvatanje podataka na osnovu odabranog vremenskog opsega
  const { data, isLoading, error, refresh } = usePerformanceMetrics(selectedTimeRange);

  // Funkcija za promenu vremenskog opsega
  const handleTimeRangeChange = (value: string) => {
    setSelectedTimeRange(value as TimeRange);
  };

  // Izračunavanje sumarnih metrika iz dohvatanih podataka
  const calculateSummary = (data: typeof data): {
      totalRequests: number;
      avgResponseTime: number | null;
      errorRate: number | null;
      avgCpuUsage: number | null;
      avgMemoryUsage: number | null;
  } => {
      if (!data || data.length === 0) {
          return {
              totalRequests: 0,
              avgResponseTime: null,
              errorRate: null,
              avgCpuUsage: null,
              avgMemoryUsage: null,
          };
      }

      const totalRequests = data.reduce((sum, point) => sum + (point.requestCount ?? 0), 0); // Koristite ?? 0 za sigurno sabiranje
      const totalResponseTime = data.reduce((sum, point) => sum + (point.responseTime ?? 0), 0);
      // Za stopu grešaka i korišćenje resursa, prosečna vrednost je obično relevantnija od sume
      const totalErrorRate = data.reduce((sum, point) => sum + (point.errorRate ?? 0), 0);
      const totalCpuUsage = data.reduce((sum, point) => sum + (point.cpuUsage ?? 0), 0);
      const totalMemoryUsage = data.reduce((sum, point) => sum + (point.memoryUsage ?? 0), 0);

      const count = data.length; // Broj tačaka podataka
      const avgResponseTime = count > 0 ? totalResponseTime / count : null;
      // Prosečna stopa grešaka se obično računa kao ukupan broj grešaka podeljen sa ukupnim brojem zahteva,
      // ali ako errorRate predstavlja procenat po tački, onda je prosek tih procenata relevantan.
      // Pretpostavljamo da errorRate u data pointu predstavlja procenat.
      const avgErrorRate = count > 0 ? totalErrorRate / count : null;
      const avgCpuUsage = count > 0 ? totalCpuUsage / count : null;
      const avgMemoryUsage = count > 0 ? totalMemoryUsage / count : null;


      return {
          totalRequests, // Ukupan broj zahteva
          avgResponseTime,
          errorRate: avgErrorRate,
          avgCpuUsage,
          avgMemoryUsage,
      };
  };

  const summary = calculateSummary(data);


  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle>Performance Overview</CardTitle>
          <CardDescription>
            Overall system performance metrics over time.
          </CardDescription>
        </div>
        <div className="flex items-center gap-4">
           {/* Dropdown za odabir vremenskog opsega */}
           <div className="flex items-center gap-2">
               <Label htmlFor="timeRange">Time Range:</Label>
               <Select value={selectedTimeRange} onValueChange={handleTimeRangeChange}>
                   <SelectTrigger id="timeRange" className="w-[180px]">
                       <SelectValue placeholder="Select time range" />
                   </SelectTrigger>
                   <SelectContent>
                       <SelectItem value="1h">Last 1 Hour</SelectItem>
                       <SelectItem value="6h">Last 6 Hours</SelectItem>
                       <SelectItem value="24h">Last 24 Hours</SelectItem>
                       <SelectItem value="7d">Last 7 Days</SelectItem>
                       <SelectItem value="30d">Last 30 Days</SelectItem>
                       <SelectItem value="all">All Time</SelectItem>
                   </SelectContent>
               </Select>
           </div>
           {/* Dugme za osvežavanje */}
           <Button variant="outline" size="sm" onClick={refresh} disabled={isLoading}>
               {isLoading ? (
                   <Loader2 className="h-4 w-4 mr-2 animate-spin" />
               ) : (
                   <RefreshCw className="h-4 w-4 mr-2" />
               )}
               Refresh
           </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Prikaz sumarnih metrika unutar ove kartice */}
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
             <Card>
                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                      <Activity className="h-4 w-4 text-muted-foreground" /> {/* Korišćena Activity ikona */}
                 </CardHeader>
                 <CardContent>
                      <div className="text-2xl font-bold">
                           {formatValue(summary.totalRequests, "count")}
                      </div>
                      <p className="text-xs text-muted-foreground">in selected range</p>
                 </CardContent>
             </Card>
              <Card>
                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" /> {/* Korišćena Clock ikona */}
                 </CardHeader>
                 <CardContent>
                      <div className="text-2xl font-bold">
                           {formatValue(summary.avgResponseTime, "time")}
                      </div>
                      <p className="text-xs text-muted-foreground">in selected range</p>
                 </CardContent>
             </Card>
              <Card>
                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Avg Error Rate</CardTitle>
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" /> {/* Korišćena AlertTriangle ikona */}
                 </CardHeader>
                 <CardContent>
                      <div className="text-2xl font-bold">
                           {formatValue(summary.errorRate, "percentage")}
                      </div>
                      <p className="text-xs text-muted-foreground">in selected range</p>
                 </CardContent>
             </Card>
              <Card>
                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Avg System Resources</CardTitle>
                      <Cpu className="h-4 w-4 text-muted-foreground" /> {/* Korišćena Cpu ikona */}
                 </CardHeader>
                 <CardContent>
                      <div className="text-lg font-bold">
                           CPU: {formatValue(summary.avgCpuUsage, "percentage")}
                      </div>
                       <div className="text-lg font-bold">
                           Mem: {formatValue(summary.avgMemoryUsage, "memory")} {/* Koristite 'memory' tip za formatiranje */}
                      </div>
                      <p className="text-xs text-muted-foreground">in selected range</p>
                 </CardContent>
             </Card>
         </div>


        {/* Prikaz sirovih podataka ili grafikona */}
        {isLoading && (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="text-center text-destructive">
            <p>{error}</p>
            <Button variant="outline" onClick={refresh} className="mt-4">
              Try Again
            </Button>
          </div>
        )}

        {data && data.length > 0 && (
          <div className="space-y-4">
            {/* Ovde biste obično integrisali grafikone (npr. Recharts, Chart.js) */}
            {/* Za sada, prikazaćemo podatke u jednostavnoj listi radi provere */}
            <h4 className="text-lg font-semibold mt-4">Raw Data Points:</h4>
            <div className="max-h-96 overflow-y-auto border rounded-md p-4">
                <ul className="space-y-2 text-sm">
                    {data.map((point, index) => (
                        <li key={index} className="border-b pb-2 last:border-b-0 last:pb-0">
                           <strong>{format(new Date(point.timestamp), 'yyyy-MM-dd HH:mm:ss')}:</strong>
                           {' '} Response: {formatValue(point.responseTime, 'time')},
                           {' '} Requests: {formatValue(point.requestCount, 'count')},
                           {' '} Errors: {formatValue(point.errorRate, 'percentage')},
                           {' '} CPU: {formatValue(point.cpuUsage, 'percentage')},
                           {' '} Memory: {formatValue(point.memoryUsage, 'memory')}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Primer gde biste dodali grafikone */}
            {/* <LineChart data={data} /> */}
            {/* <BarChart data={data} /> */}

          </div>
        )}

         {data && data.length === 0 && !isLoading && !error && (
             <div className="text-center text-muted-foreground py-8">
                 No performance data available for the selected time range.
             </div>
         )}


      </CardContent>
    </Card>
  );
};

export default PerformanceMetrics;
