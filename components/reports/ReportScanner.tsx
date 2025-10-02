// components/reports/ReportScanner.tsx - FIXED VERSION

"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Loader2, 
  AlertCircle,
  Printer,
  FileDown
} from 'lucide-react';
import { scanAllReports } from '@/actions/reports/scan-all-reports';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface ScannedReport {
  id: string;
  fileName: string;
  filePath: string;
  publicUrl: string;
  organizationName: string;
  shortNumber: string | null;
  month: number;
  year: number;
  paymentType: 'prepaid' | 'postpaid';
  templateType: 'telekom' | 'globaltel' | 'unknown';
  fileSize: number;
  lastModified: Date;
  reportType: 'template' | 'complete' | 'original';
  accountNumber?: number | null;
  totalSum?: number | null;
}

export default function ReportScanner() {
  const [reports, setReports] = useState<ScannedReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<ScannedReport[]>([]);
  const [organizations, setOrganizations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Selected reports for batch operations
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedPaymentType, setSelectedPaymentType] = useState<string>('all');
  const [selectedTemplateType, setSelectedTemplateType] = useState<string>('all');
  const [selectedReportType, setSelectedReportType] = useState<string>('all');
  const [sumFilter, setSumFilter] = useState<'all' | 'zero' | 'positive'>('all');

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reports, searchTerm, selectedOrg, selectedYear, selectedMonth, selectedPaymentType, selectedTemplateType, selectedReportType, sumFilter]);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await scanAllReports();
      
      if (result.success) {
        setReports(result.reports);
        setOrganizations(result.organizations);
      } else {
        setError(result.error || 'Failed to load reports');
      }
    } catch (err) {
      setError('An error occurred while loading reports');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...reports];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        r.organizationName.toLowerCase().includes(term) ||
        r.fileName.toLowerCase().includes(term) ||
        r.shortNumber?.includes(term)
      );
    }

    if (selectedOrg !== 'all') {
      filtered = filtered.filter(r => r.organizationName === selectedOrg);
    }

    if (selectedYear !== 'all') {
      filtered = filtered.filter(r => r.year === parseInt(selectedYear));
    }

    if (selectedMonth !== 'all') {
      filtered = filtered.filter(r => r.month === parseInt(selectedMonth));
    }

    if (selectedPaymentType !== 'all') {
      filtered = filtered.filter(r => r.paymentType === selectedPaymentType);
    }

    if (selectedTemplateType !== 'all') {
      filtered = filtered.filter(r => r.templateType === selectedTemplateType);
    }

    if (selectedReportType !== 'all') {
      filtered = filtered.filter(r => r.reportType === selectedReportType);
    }

    if (sumFilter === 'zero') {
      filtered = filtered.filter(r => r.totalSum === 0);
    } else if (sumFilter === 'positive') {
      filtered = filtered.filter(r => r.totalSum && r.totalSum > 0);
    }

    setFilteredReports(filtered);
  };

  const toggleSelectReport = (reportId: string) => {
    setSelectedReports(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reportId)) {
        newSet.delete(reportId);
      } else {
        newSet.add(reportId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedReports.size === filteredReports.length) {
      setSelectedReports(new Set());
    } else {
      setSelectedReports(new Set(filteredReports.map(r => r.id)));
    }
  };

  const printSelectedReports = async () => {
    const selectedReportsList = filteredReports.filter(r => selectedReports.has(r.id));
    
    if (selectedReportsList.length === 0) {
      alert('Molimo izaberite izveštaje za štampu');
      return;
    }

    // Check if any reports are Excel files
    const hasExcelFiles = selectedReportsList.some(r => 
      r.fileName.toLowerCase().endsWith('.xlsx') || 
      r.fileName.toLowerCase().endsWith('.xls')
    );

    if (hasExcelFiles) {
      const confirmed = confirm(
        '⚠️ NAPOMENA O ŠTAMPANJU EXCEL FAJLOVA\n\n' +
        `Selektovano: ${selectedReportsList.length} fajlova\n\n` +
        'Browser NE MOŽE automatski da štampa Excel fajlove.\n\n' +
        'OPCIJE:\n' +
        '1. Kliknite OK - Fajlovi će se otvarati jedan po jedan u novim tabovima\n' +
        '   (možda ćete morati da dozvolite pop-up prozore)\n\n' +
        '2. Kliknite Cancel - Koristite dugme "Preuzmi" za batch download\n\n' +
        'Napomena: Za svaki fajl ćete morati ručno da izaberete štampač.'
      );

      if (!confirmed) {
        return;
      }

      // Open files in new tabs (browser will prompt to download/open)
      setIsPrinting(true);
      try {
        for (let i = 0; i < selectedReportsList.length; i++) {
          const report = selectedReportsList[i];
          
          // Open in new tab - browser will handle Excel file
          window.open(report.publicUrl, '_blank');
          
          // Delay between opening to avoid browser blocking
          if (i < selectedReportsList.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 800));
          }
        }
        
        alert(
          `✅ Otvoreno ${selectedReportsList.length} fajlova u novim tabovima!\n\n` +
          'Za svaki fajl:\n' +
          '1. Preuzmiće se ili će se otvoriti u Excel-u (zavisi od podešavanja)\n' +
          '2. Otvorite fajl ako nije automatski otvoren\n' +
          '3. Pritisnite Ctrl+P za štampanje\n\n' +
          'TIP: Ako se fajlovi ne otvaraju, dozvolite pop-up prozore za ovaj sajt.'
        );
      } catch (error) {
        console.error('Error opening reports:', error);
        alert('Greška pri otvaranju izveštaja');
      } finally {
        setIsPrinting(false);
      }
      return;
    }

    // For non-Excel files (PDF, images, etc.), proceed with printing
    setIsPrinting(true);
    try {
      for (let i = 0; i < selectedReportsList.length; i++) {
        const report = selectedReportsList[i];
        
        const printWindow = window.open(report.publicUrl, '_blank');
        
        if (printWindow) {
          await new Promise<void>((resolve) => {
            const checkLoad = setInterval(() => {
              if (printWindow.document.readyState === 'complete') {
                clearInterval(checkLoad);
                
                setTimeout(() => {
                  printWindow.print();
                  
                  setTimeout(() => {
                    printWindow.close();
                    resolve();
                  }, 500);
                }, 1000);
              }
            }, 100);
            
            setTimeout(() => {
              printWindow.close();
              resolve();
            }, 10000);
          });
          
          if (i < selectedReportsList.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
      
      alert(`Štampa završena: ${selectedReportsList.length} izveštaja`);
    } catch (error) {
      console.error('Error printing reports:', error);
      alert('Greška pri štampi izveštaja');
    } finally {
      setIsPrinting(false);
    }
  };

  const downloadSelectedReports = async () => {
    const selectedReportsList = filteredReports.filter(r => selectedReports.has(r.id));
    
    if (selectedReportsList.length === 0) {
      alert('Molimo izaberite izveštaje za preuzimanje');
      return;
    }

    const confirmed = confirm(
      `Preuzimanje ${selectedReportsList.length} fajlova\n\n` +
      'NAPOMENA: Browser može da blokira multiple download-ove.\n\n' +
      'Ako se to desi:\n' +
      '1. Dozvolite download-ove za ovaj sajt\n' +
      '2. Kliknite ponovo na "Preuzmi"\n\n' +
      'Da li želite da nastavite?'
    );

    if (!confirmed) return;

    setIsDownloading(true);

    try {
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < selectedReportsList.length; i++) {
        const report = selectedReportsList[i];
        
        try {
          // Create invisible iframe for download
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          iframe.src = report.publicUrl;
          document.body.appendChild(iframe);
          
          // Remove iframe after download starts
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 2000);
          
          successCount++;
          
          // Longer delay to avoid browser blocking
          if (i < selectedReportsList.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.error(`Failed to download ${report.fileName}:`, error);
          failCount++;
        }
      }
      
      alert(
        `Download završen!\n\n` +
        `✅ Uspešno: ${successCount} fajlova\n` +
        (failCount > 0 ? `❌ Neuspešno: ${failCount} fajlova\n\n` : '\n') +
        `Fajlovi su u vašem Downloads folderu.\n\n` +
        'TIP: Ako nedostaju fajlovi, proverite podešavanja browsera za download-ove.'
      );
    } catch (error) {
      console.error('Error downloading reports:', error);
      alert('Greška pri preuzimanju izveštaja');
    } finally {
      setIsDownloading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: 'RSD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const years = [...new Set(reports.map(r => r.year))].sort((a, b) => b - a);
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const monthNames = ['Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun', 'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'];

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex gap-2 items-center justify-between">
        <Button 
          onClick={loadReports} 
          disabled={loading}
          variant="outline"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Skeniranje...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Skeniraj sve izveštaje
            </>
          )}
        </Button>

        {selectedReports.size > 0 && (
          <div className="flex gap-2">
            <Badge variant="secondary" className="text-sm">
              {selectedReports.size} izabrano
            </Badge>
            <Button 
              onClick={printSelectedReports}
              disabled={isPrinting}
              variant="default"
              size="sm"
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isPrinting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Otvaram fajlove...
                </>
              ) : (
                <>
                  <Printer className="mr-2 h-4 w-4" />
                  Otvori za štampu ({selectedReports.size})
                </>
              )}
            </Button>
            <Button 
              onClick={downloadSelectedReports}
              disabled={isDownloading}
              variant="outline"
              size="sm"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Preuzimam...
                </>
              ) : (
                <>
                  <FileDown className="mr-2 h-4 w-4" />
                  Preuzmi ({selectedReports.size})
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {reports.length > 0 && (
        <>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-3">
            <Input
              placeholder="Pretraži..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="col-span-1 md:col-span-3 lg:col-span-2"
            />

            <Select value={selectedOrg} onValueChange={setSelectedOrg}>
              <SelectTrigger>
                <SelectValue placeholder="Organizacija" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Sve organizacije</SelectItem>
                {organizations.map(org => (
                  <SelectItem key={org} value={org}>{org}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue placeholder="Godina" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Sve godine</SelectItem>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Mesec" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Svi meseci</SelectItem>
                {months.map(month => (
                  <SelectItem key={month} value={month.toString()}>
                    {monthNames[month - 1]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedPaymentType} onValueChange={setSelectedPaymentType}>
              <SelectTrigger>
                <SelectValue placeholder="Tip plaćanja" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Svi tipovi</SelectItem>
                <SelectItem value="prepaid">Prepaid</SelectItem>
                <SelectItem value="postpaid">Postpaid</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedTemplateType} onValueChange={setSelectedTemplateType}>
              <SelectTrigger>
                <SelectValue placeholder="Tip template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Svi template</SelectItem>
                <SelectItem value="telekom">Telekom</SelectItem>
                <SelectItem value="globaltel">GlobalTel</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedReportType} onValueChange={setSelectedReportType}>
              <SelectTrigger>
                <SelectValue placeholder="Tip izveštaja" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Svi tipovi</SelectItem>
                <SelectItem value="template">Template</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
                <SelectItem value="original">Original</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sumFilter} onValueChange={(value: 'all' | 'zero' | 'positive') => setSumFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Suma filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Sve sume</SelectItem>
                <SelectItem value="zero">Suma = 0</SelectItem>
                <SelectItem value="positive">Suma &gt; 0</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results Summary */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Pronađeno {filteredReports.length} od {reports.length} izveštaja
            </p>
            {filteredReports.length > 0 && (
              <div 
                className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 px-3 py-2 rounded-md transition-colors"
                onClick={toggleSelectAll}
              >
                <Checkbox 
                  checked={selectedReports.size === filteredReports.length}
                />
                <span className="text-sm">
                  {selectedReports.size === filteredReports.length ? 'Poništi sve' : 'Izaberi sve'}
                </span>
              </div>
            )}
          </div>

          {/* Reports List */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredReports.map(report => (
              <div 
                key={report.id}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/20 transition-colors"
              >
                <Checkbox
                  checked={selectedReports.has(report.id)}
                  onCheckedChange={() => toggleSelectReport(report.id)}
                />
                
                <FileText className="h-8 w-8 text-blue-500 flex-shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{report.organizationName}</div>
                  <div className="text-xs text-muted-foreground">{report.fileName}</div>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {monthNames[report.month - 1]} {report.year}
                    </Badge>
                    <Badge variant={report.paymentType === 'prepaid' ? 'default' : 'secondary'} className="text-xs">
                      {report.paymentType}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {report.reportType}
                    </Badge>
                    {report.templateType !== 'unknown' && (
                      <Badge variant="outline" className="text-xs">
                        {report.templateType}
                      </Badge>
                    )}
                    {report.accountNumber != null && (
                      <Badge variant="secondary" className="text-xs">
                        Nalog: {report.accountNumber}
                      </Badge>
                    )}
                    {report.totalSum != null && (
                      <Badge 
                        variant={report.totalSum === 0 ? 'outline' : 'default'} 
                        className={`text-xs ${report.totalSum > 0 ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}`}
                      >
                        {formatCurrency(report.totalSum)}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <a
                    href={report.publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                  >
                    <Eye className="h-3 w-3 mr-1" /> View
                  </a>
                  <a
                    href={report.publicUrl}
                    download={report.fileName}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                  >
                    <Download className="h-3 w-3 mr-1" /> Download
                  </a>
                  <button
                    onClick={() => {
                      // If no reports are selected, just print this one
                      if (selectedReports.size === 0) {
                        window.open(report.publicUrl, '_blank');
                      } else {
                        // Print all selected reports
                        printSelectedReports();
                      }
                    }}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                  >
                    <Printer className="h-3 w-3 mr-1" />
                    {selectedReports.size > 0 ? `(${selectedReports.size})` : ''}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!loading && reports.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Kliknite &quot;Skeniraj sve izveštaje&quot; da učitate izveštaje</p>
        </div>
      )}
    </div>
  );
}