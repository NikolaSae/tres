// components/reports/UnifiedReportsScanner.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Eye, RefreshCw, Calendar, FileText, Users, DollarSign } from "lucide-react";
import { scanUnifiedReports } from "@/actions/reports/scan-unified-reports";

interface UnifiedReport {
  id: string;
  fileName: string;
  filePath: string;
  publicUrl: string;
  month: number;
  year: number;
  paymentType: 'prepaid' | 'postpaid' | 'combined';
  fileSize: number;
  lastModified: Date;
  organizationCount?: number;
  totalSum?: number | null;
}

const MONTH_NAMES = [
  'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun',
  'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
];

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun',
  'Jul', 'Avg', 'Sep', 'Okt', 'Nov', 'Dec'
];

export default function UnifiedReportsScanner() {
  const [reports, setReports] = useState<UnifiedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await scanUnifiedReports();
      
      if (result.success) {
        setReports(result.reports);
      } else {
        setError(result.error || 'Failed to load unified reports');
      }
    } catch (err: any) {
      console.error('Error loading unified reports:', err);
      setError(err?.message || 'An error occurred while loading reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: 'RSD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Get unique years for filtering
  const availableYears = Array.from(new Set(reports.map(r => r.year))).sort((a, b) => b - a);

  // Filter reports
  const filteredReports = reports.filter(report => {
    if (selectedYear !== 'all' && report.year !== selectedYear) return false;
    return true;
  });

  // Group reports by year and month
  const groupedReports = filteredReports.reduce((acc, report) => {
    const key = `${report.year}-${report.month}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(report);
    return acc;
  }, {} as Record<string, UnifiedReport[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Učitavam unified izveštaje...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
        <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
          <span className="font-semibold">Greška:</span>
          <span>{error}</span>
        </div>
        <Button onClick={loadReports} variant="outline" size="sm" className="mt-3">
          <RefreshCw className="h-4 w-4 mr-2" /> Pokušaj ponovo
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Statistics Cards */}
      {reports.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Ukupno izveštaja</span>
            </div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{reports.length}</div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-xs font-medium text-green-600 dark:text-green-400">Organizacija</span>
            </div>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {reports.reduce((sum, r) => sum + (r.organizationCount || 0), 0)}
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Period</span>
            </div>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {Math.min(...reports.map(r => r.year))} - {Math.max(...reports.map(r => r.year))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <span className="text-xs font-medium text-orange-600 dark:text-orange-400">Ukupan iznos</span>
            </div>
            <div className="text-lg font-bold text-orange-900 dark:text-orange-100">
              {formatCurrency(reports.reduce((sum, r) => sum + (r.totalSum || 0), 0))}
            </div>
          </div>
        </div>
      )}

      {/* Header with Stats and Refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{reports.length}</span>
            <span className="text-muted-foreground">ukupno izveštaja</span>
          </div>
          {filteredReports.length !== reports.length && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>→</span>
              <span className="font-medium">{filteredReports.length}</span>
              <span>filtrirano</span>
            </div>
          )}
        </div>
        <Button onClick={loadReports} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Osveži
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Godina:</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          >
            <option value="all">Sve godine</option>
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 ml-auto text-xs text-muted-foreground">
          <span className="bg-blue-50 dark:bg-blue-950 px-2 py-1 rounded border">
            📂 Lokacija: <code className="font-mono">public/reports/prepaid/</code>
          </span>
        </div>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nema unified izveštaja</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Trenutno nema generisanih unified izveštaja u <code className="bg-muted px-2 py-1 rounded">public/reports/prepaid/</code> folderu.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Očekivani format: <span className="font-mono">Humanitarni_SMS_i_VOICE_brojevi_2021-2025-Mesec_Godina.xlsx</span>
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedReports)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([key, monthReports]) => {
              const [year, month] = key.split('-').map(Number);
              
              return (
                <div key={key} className="space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold text-lg">
                        {MONTH_NAMES[month - 1]} {year}
                      </h3>
                      <span className="text-sm text-muted-foreground">
                        ({monthReports.length} {monthReports.length === 1 ? 'izveštaj' : 'izveštaja'})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded-full font-medium">
                        Prepaid
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {monthReports.map(report => (
                      <div
                        key={report.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/20 transition-colors group"
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <FileText className="h-10 w-10 text-blue-500 flex-shrink-0" />
                          
                          <div className="flex flex-col min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold truncate text-base">
                                Humanitarni SMS i VOICE brojevi
                              </span>
                              <span className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-2 py-0.5 rounded-full">
                                {MONTH_NAMES_SHORT[report.month - 1]} {report.year}
                              </span>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-1">
                              <span className="font-mono bg-muted px-2 py-0.5 rounded">
                                {formatFileSize(report.fileSize)}
                              </span>
                              
                              {report.organizationCount !== undefined && report.organizationCount > 0 && (
                                <span className="flex items-center gap-1 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 px-2 py-0.5 rounded">
                                  <Users className="h-3 w-3" />
                                  <strong>{report.organizationCount}</strong> organizacija
                                </span>
                              )}
                              
                              {report.totalSum && (
                                <span className="flex items-center gap-1 font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 px-2 py-0.5 rounded">
                                  <DollarSign className="h-3 w-3" />
                                  {formatCurrency(report.totalSum)}
                                </span>
                              )}
                            </div>
                            
                            <div className="text-xs text-muted-foreground">
                              <span className="font-mono">{report.fileName}</span>
                              <span className="mx-2">•</span>
                              <span>Modifikovan: {new Date(report.lastModified).toLocaleDateString('sr-RS')} {new Date(report.lastModified).toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 flex-shrink-0">
                          <Button size="sm" variant="outline" asChild>
                            <a href={report.publicUrl} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-3 w-3 mr-1" /> Pregled
                            </a>
                          </Button>
                          <Button size="sm" variant="default" asChild>
                            <a href={report.publicUrl} download={report.fileName}>
                              <Download className="h-3 w-3 mr-1" /> Preuzmi
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}