//components/reports/ReportScanner.tsx
"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Search, 
  Download, 
  Eye, 
  Printer, 
  Calendar, 
  Building2, 
  CreditCard, 
  Settings,
  RefreshCw,
  Filter,
  X,
  PrinterIcon
} from 'lucide-react';

// Import types from the server action
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
}

interface ScanResult {
  success: boolean;
  reports: ScannedReport[];
  totalFiles: number;
  organizations: string[];
  error?: string;
}

const ReportScanner = () => {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [printingAll, setPrintingAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter states
  const [selectedOrganization, setSelectedOrganization] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedPaymentType, setSelectedPaymentType] = useState<string>('all');
  const [selectedTemplateType, setSelectedTemplateType] = useState<string>('all');
  const [selectedReportType, setSelectedReportType] = useState<string>('all');

  const scanReports = async () => {
    setLoading(true);
    try {
      // Import the server action dynamically
      const { scanAllReports } = await import('@/actions/reports/scan-all-reports');
      const result = await scanAllReports();
      setScanResult(result);
    } catch (error) {
      console.error('Error scanning reports:', error);
      setScanResult({
        success: false,
        reports: [],
        totalFiles: 0,
        organizations: [],
        error: 'Failed to scan reports'
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-scan on component mount
  useEffect(() => {
    scanReports();
  }, []);

  // Get unique years from reports
  const availableYears = useMemo(() => {
    if (!scanResult?.reports) return [];
    const years = [...new Set(scanResult.reports.map(r => r.year))].sort((a, b) => b - a);
    return years;
  }, [scanResult]);

  // Filter reports based on selected filters
  const filteredReports = useMemo(() => {
    if (!scanResult?.reports) return [];
    
    return scanResult.reports.filter(report => {
      // Search filter
      if (searchTerm && !report.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !report.fileName.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Organization filter
      if (selectedOrganization !== 'all' && report.organizationName !== selectedOrganization) {
        return false;
      }
      
      // Month filter
      if (selectedMonth !== 'all' && report.month.toString() !== selectedMonth) {
        return false;
      }
      
      // Year filter
      if (selectedYear !== 'all' && report.year.toString() !== selectedYear) {
        return false;
      }
      
      // Payment type filter
      if (selectedPaymentType !== 'all' && report.paymentType !== selectedPaymentType) {
        return false;
      }
      
      // Template type filter
      if (selectedTemplateType !== 'all' && report.templateType !== selectedTemplateType) {
        return false;
      }
      
      // Report type filter
      if (selectedReportType !== 'all' && report.reportType !== selectedReportType) {
        return false;
      }
      
      return true;
    });
  }, [scanResult, searchTerm, selectedOrganization, selectedMonth, selectedYear, selectedPaymentType, selectedTemplateType, selectedReportType]);

  // Group reports by organization
  const groupedReports = useMemo(() => {
    const groups: { [key: string]: ScannedReport[] } = {};
    filteredReports.forEach(report => {
      if (!groups[report.organizationName]) {
        groups[report.organizationName] = [];
      }
      groups[report.organizationName].push(report);
    });
    return groups;
  }, [filteredReports]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getMonthName = (month: number) => {
    const months = [
      'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun',
      'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
    ];
    return months[month - 1] || month.toString();
  };

  const handlePreview = (publicUrl: string, fileName: string) => {
    const previewWindow = window.open(publicUrl, '_blank');
    if (previewWindow) {
      previewWindow.document.title = fileName;
    }
  };

  const handlePrint = (publicUrl: string) => {
    const printWindow = window.open(publicUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const handlePrintAll = async () => {
    if (filteredReports.length === 0) {
      alert('Nema izveštaja za štampanje!');
      return;
    }

    // Confirm action
    const confirmed = confirm(
      `Da li ste sigurni da želite da štampate ${filteredReports.length} izveštaja? Ovo može da potraje.`
    );

    if (!confirmed) return;

    setPrintingAll(true);

    try {
      // Print each report with a small delay between them
      for (let i = 0; i < filteredReports.length; i++) {
        const report = filteredReports[i];
        
        // Open print window for each report
        const printWindow = window.open(report.publicUrl, '_blank');
        
        if (printWindow) {
          // Set document title
          printWindow.document.title = `${report.organizationName} - ${report.fileName}`;
          
          // Wait for window to load then print
          printWindow.onload = () => {
            setTimeout(() => {
              printWindow.print();
              // Close the window after printing
              setTimeout(() => {
                printWindow.close();
              }, 1000);
            }, 500);
          };
        }

        // Add delay between opening windows to prevent browser blocking
        if (i < filteredReports.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }

      alert(`Poslato ${filteredReports.length} izveštaja na štampanje!`);
    } catch (error) {
      console.error('Error printing reports:', error);
      alert('Greška prilikom štampanja izveštaja!');
    } finally {
      setPrintingAll(false);
    }
  };

  const clearAllFilters = () => {
    setSelectedOrganization('all');
    setSelectedMonth('all');
    setSelectedYear('all');
    setSelectedPaymentType('all');
    setSelectedTemplateType('all');
    setSelectedReportType('all');
    setSearchTerm('');
  };

  const getReportTypeColor = (reportType: string) => {
    switch (reportType) {
      case 'template': return 'bg-blue-100 text-blue-800';
      case 'complete': return 'bg-green-100 text-green-800';
      case 'original': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentTypeColor = (paymentType: string) => {
    switch (paymentType) {
      case 'prepaid': return 'bg-purple-100 text-purple-800';
      case 'postpaid': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!scanResult && loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin mr-2" />
          <span>Scanning reports...</span>
        </CardContent>
      </Card>
    );
  }

  if (scanResult?.error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
          <div className="text-red-600">Error: {scanResult.error}</div>
          <Button onClick={scanReports} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Scan
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with scan info */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">All Reports Scanner</h3>
          <p className="text-sm text-muted-foreground">
            Found {scanResult?.totalFiles || 0} reports from {scanResult?.organizations?.length || 0} organizations
          </p>
        </div>
        <Button onClick={scanReports} disabled={loading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Rescan
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                onClick={handlePrintAll}
                disabled={printingAll || filteredReports.length === 0}
                variant="default"
                className="bg-green-600 hover:bg-green-700"
              >
                <PrinterIcon className={`h-4 w-4 mr-2 ${printingAll ? 'animate-pulse' : ''}`} />
                {printingAll ? 'Štampam...' : `Štampaj sve (${filteredReports.length})`}
              </Button>
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by organization name or file name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Organization</label>
              <Select value={selectedOrganization} onValueChange={setSelectedOrganization}>
                <SelectTrigger>
                  <SelectValue placeholder="All organizations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All organizations</SelectItem>
                  {scanResult?.organizations?.map(org => (
                    <SelectItem key={org} value={org}>{org}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Month</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="All months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All months</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <SelectItem key={month} value={month.toString()}>
                      {getMonthName(month)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="All years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All years</SelectItem>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Payment Type</label>
              <Select value={selectedPaymentType} onValueChange={setSelectedPaymentType}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="prepaid">Prepaid</SelectItem>
                  <SelectItem value="postpaid">Postpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Template</label>
              <Select value={selectedTemplateType} onValueChange={setSelectedTemplateType}>
                <SelectTrigger>
                  <SelectValue placeholder="All templates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All templates</SelectItem>
                  <SelectItem value="telekom">Telekom</SelectItem>
                  <SelectItem value="globaltel">GlobalTel</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Report Type</label>
              <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="All report types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="template">Template</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                  <SelectItem value="original">Original</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filter summary */}
          {filteredReports.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4">
              <span>Showing {filteredReports.length} of {scanResult?.totalFiles || 0} reports</span>
              {filteredReports.length !== scanResult?.totalFiles && (
                <Badge variant="outline" className="text-xs">Filtered</Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-6">
        {Object.keys(groupedReports).length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-3">
              <FileText className="h-12 w-12 text-muted-foreground/50" />
              <div className="text-lg font-medium text-muted-foreground">
                No reports found
              </div>
              <div className="text-sm text-muted-foreground text-center max-w-sm">
                Try adjusting your filters or check if reports exist in the public/reports directory.
              </div>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedReports).map(([orgName, reports]) => (
            <Card key={orgName}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {orgName}
                  <Badge variant="secondary" className="ml-auto">
                    {reports.length} reports
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reports.map(report => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/20 transition-colors group"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="h-8 w-8 text-blue-500 flex-shrink-0" />
                        
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="font-medium truncate text-sm">
                            {report.fileName}
                          </div>
                          
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              <Calendar className="h-3 w-3 mr-1" />
                              {getMonthName(report.month)} {report.year}
                            </Badge>
                            
                            <Badge className={`text-xs ${getPaymentTypeColor(report.paymentType)}`}>
                              <CreditCard className="h-3 w-3 mr-1" />
                              {report.paymentType}
                            </Badge>
                            
                            <Badge className={`text-xs ${getReportTypeColor(report.reportType)}`}>
                              {report.reportType}
                            </Badge>
                            
                            {report.templateType !== 'unknown' && (
                              <Badge variant="outline" className="text-xs">
                                {report.templateType}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="text-xs text-muted-foreground mt-1">
                            {formatFileSize(report.fileSize)} • Modified: {new Date(report.lastModified).toLocaleDateString('sr-RS')}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePreview(report.publicUrl, report.fileName)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        
                        <Button size="sm" asChild variant="outline">
                          <a
                            href={report.publicUrl}
                            download={report.fileName}
                          >
                            <Download className="h-3 w-3" />
                          </a>
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePrint(report.publicUrl)}
                        >
                          <Printer className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ReportScanner;