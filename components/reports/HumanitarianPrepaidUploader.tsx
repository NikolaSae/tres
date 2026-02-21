// components/reports/HumanitarianPrepaidUploader.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Calendar,
  Building2,
  TrendingUp,
  Loader2,
  Sparkles,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { importHumanitarianPrepaidTransactions } from "@/actions/humanitarian-orgs/import-prepaid-transactions";
import { getAllHumanitarianOrgs, findHumanitarianOrgByShortNumber } from "@/actions/humanitarian-orgs/find-org-by-short-number";
import { autoDetectReportInfo, formatAutoDetectedInfo } from "@/lib/humanitarian-report-parser";

interface HumanitarianOrg {
  id: string;
  name: string;
}

interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: any[];
  summary: {
    totalServices: number;
    totalDays: number;
    servicesCreated: number;
    servicesLinked: number;
    servicesExisting: number;
    fileName: string;
    dateRange: {
      start: Date;
      end: Date;
    };
  };
}

export default function HumanitarianPrepaidUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [autoDetectedInfo, setAutoDetectedInfo] = useState<any>(null);
  const [organizations, setOrganizations] = useState<HumanitarianOrg[]>([]);
  
  // Load organizations on mount
  useEffect(() => {
    async function fetchOrgs() {
      const result = await getAllHumanitarianOrgs();
      if (result.success && result.organizations) {
        setOrganizations(result.organizations);
      }
    }
    fetchOrgs();
  }, []);

  const months = [
    { value: "1", label: "Januar" },
    { value: "2", label: "Februar" },
    { value: "3", label: "Mart" },
    { value: "4", label: "April" },
    { value: "5", label: "Maj" },
    { value: "6", label: "Jun" },
    { value: "7", label: "Jul" },
    { value: "8", label: "Avgust" },
    { value: "9", label: "Septembar" },
    { value: "10", label: "Oktobar" },
    { value: "11", label: "Novembar" },
    { value: "12", label: "Decembar" },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    if (!validTypes.includes(selectedFile.type)) {
      toast.error("Nevažeći tip fajla. Molimo odaberite Excel fajl (.xlsx ili .xls)");
      return;
    }

    setFile(selectedFile);
    setImportResult(null);
    setAutoDetectedInfo(null);
    
    // Auto-analyze file
    setIsAnalyzing(true);
    toast.info("Analiziram fajl...");

    try {
      const detectedInfo = await autoDetectReportInfo(selectedFile);
      setAutoDetectedInfo(detectedInfo);

      // Auto-fill month and year if detected
      if (detectedInfo.month) {
        const month = (detectedInfo.month.getMonth() + 1).toString();
        const year = detectedInfo.month.getFullYear().toString();
        setSelectedMonth(month);
        setSelectedYear(year);
      }

      // Try to find organization by short number
      if (detectedInfo.shortNumber) {
        const orgResult = await findHumanitarianOrgByShortNumber(detectedInfo.shortNumber);
        
        if (orgResult.success && orgResult.organization) {
          setSelectedOrg(orgResult.organization.id);
          toast.success(
            `Organizacija pronađena: ${orgResult.organization.name}`,
            {
              description: `${orgResult.organization.serviceCount} servisa u contract-u`
            }
          );
        } else if (orgResult.organizationId) {
          // Org found but no active contract
          setSelectedOrg(orgResult.organizationId);
          toast.warning(
            `${orgResult.organizationName} nema aktivan ugovor`,
            {
              description: "Možete nastaviti, ali servisi neće biti linkovani u contract"
            }
          );
        } else {
          toast.warning(
            `Organizacija sa kratkim brojem ${detectedInfo.shortNumber} nije pronađena`,
            {
              description: "Molimo odaberite organizaciju ručno"
            }
          );
        }
      }

      const formattedInfo = formatAutoDetectedInfo(detectedInfo);
      toast.success("Fajl analiziran!", {
        description: formattedInfo
      });

    } catch (error: any) {
      console.error("Auto-detection error:", error);
      toast.error("Greška pri analizi fajla", {
        description: "Molimo popunite polja ručno"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedOrg || !selectedMonth || !selectedYear) {
      toast.error("Molimo popunite sva polja");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setImportResult(null);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Create month date (first day of selected month)
      const month = new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1, 1);

      // Call import function
      const result = await importHumanitarianPrepaidTransactions(
        file,
        selectedOrg,
        month
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.success) {
        setImportResult(result as ImportResult);
        
        toast.success(
          `Uspešno importovano ${result.imported} transakcija!`,
          {
            description: `${result.summary.servicesCreated} novih servisa kreirano, ${result.summary.servicesLinked} linkova u contract`
          }
        );

        // Reset form
        setFile(null);
        setSelectedOrg("");
        setSelectedMonth("");
        setSelectedYear("");
        
        // Reset file input
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }

    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Greška pri upload-u", {
        description: error.message || "Pokušajte ponovo"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const isFormValid = file && selectedOrg && selectedMonth && selectedYear;

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-blue-500" />
            Import Humanitarian Prepaid Transactions
          </CardTitle>
          <CardDescription>
            Upload Excel file with prepaid transaction data (NTHDCB Standard - prepaid format)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Organization Select */}
          <div className="space-y-2">
            <Label htmlFor="organization">Humanitarna organizacija *</Label>
            <Select value={selectedOrg} onValueChange={setSelectedOrg} disabled={isUploading}>
              <SelectTrigger id="organization">
                <SelectValue placeholder="Izaberite organizaciju" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {org.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Month and Year Select */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="month">Mesec *</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={isUploading}>
                <SelectTrigger id="month">
                  <SelectValue placeholder="Izaberite mesec" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Godina *</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear} disabled={isUploading}>
                <SelectTrigger id="year">
                  <SelectValue placeholder="Izaberite godinu" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file-upload">Excel fajl *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={isUploading || isAnalyzing}
                className="cursor-pointer"
              />
              {file && (
                <Badge variant="secondary" className="whitespace-nowrap">
                  {(file.size / 1024).toFixed(1)} KB
                </Badge>
              )}
              {isAnalyzing && (
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Prihvatamo .xlsx i .xls fajlove. Sheet 4 mora sadržati prepaid podatke.
            </p>
          </div>

          {/* Auto-Detected Info */}
          {autoDetectedInfo && (
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
              <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertTitle className="text-blue-900 dark:text-blue-100">
                Automatski detektovano
              </AlertTitle>
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                <div className="mt-2 space-y-1 text-sm">
                  {autoDetectedInfo.shortNumber && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{autoDetectedInfo.shortNumber}</Badge>
                      <span>Kratki broj</span>
                    </div>
                  )}
                  {autoDetectedInfo.organizationName && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3 w-3" />
                      <span>{autoDetectedInfo.organizationName}</span>
                    </div>
                  )}
                  {autoDetectedInfo.billingType && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{autoDetectedInfo.billingType}</Badge>
                      <span>Tip naplate</span>
                    </div>
                  )}
                  {autoDetectedInfo.month && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {autoDetectedInfo.month.toLocaleString('sr-RS', { month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                  {autoDetectedInfo.startDate && autoDetectedInfo.endDate && (
                    <div className="flex items-center gap-2 text-xs">
                      <Info className="h-3 w-3" />
                      <span>
                        Period: {autoDetectedInfo.startDate.toLocaleDateString('sr-RS')} - {autoDetectedInfo.endDate.toLocaleDateString('sr-RS')}
                      </span>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Progress Bar */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Importovanje...</span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Upload Button */}
          <Button 
            onClick={handleUpload} 
            disabled={!isFormValid || isUploading}
            className="w-full"
            size="lg"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importovanje...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Importuj transakcije
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Import Results */}
{importResult && (
  <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
        <CheckCircle2 className="h-5 w-5" />
        Import uspešan!
      </CardTitle>
      <CardDescription className="text-green-800 dark:text-green-200">
        {importResult.summary.fileName}
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border">
          <div className="text-sm text-muted-foreground">Importovano</div>
          <div className="text-2xl font-bold text-green-600">
            {importResult.imported}
          </div>
          <div className="text-xs text-muted-foreground">transakcija</div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border">
          <div className="text-sm text-muted-foreground">Servisi</div>
          <div className="text-2xl font-bold text-blue-600">
            {importResult.summary.totalServices}
          </div>
          <div className="text-xs text-muted-foreground">
            {importResult.summary.servicesCreated} novo
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border">
          <div className="text-sm text-muted-foreground">Dana</div>
          <div className="text-2xl font-bold text-purple-600">
            {importResult.summary.totalDays}
          </div>
          <div className="text-xs text-muted-foreground">period</div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border">
          <div className="text-sm text-muted-foreground">Neuspešno</div>
          <div className="text-2xl font-bold text-red-600">
            {importResult.failed}
          </div>
          <div className="text-xs text-muted-foreground">greške</div>
        </div>
      </div>

      {/* Date Range Info */}
      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertTitle className="text-blue-900 dark:text-blue-100">Period</AlertTitle>
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          <div className="mt-2 text-sm">
            {new Date(importResult.summary.dateRange.start).toLocaleDateString('sr-RS')} - {new Date(importResult.summary.dateRange.end).toLocaleDateString('sr-RS')}
          </div>
        </AlertDescription>
      </Alert>

      {/* Service Details */}
      <Alert>
        <TrendingUp className="h-4 w-4" />
        <AlertTitle>Servisi</AlertTitle>
        <AlertDescription>
          <div className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Kreirano novih:</span>
              <Badge variant="default">{importResult.summary.servicesCreated}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Linkovano u contract:</span>
              <Badge variant="secondary">{importResult.summary.servicesLinked}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Već postojeći:</span>
              <Badge variant="outline">{importResult.summary.servicesExisting}</Badge>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Errors */}
      {importResult.errors && importResult.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Greške pri importu ({importResult.errors.length})</AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
              {importResult.errors.slice(0, 5).map((error, idx) => (
                <div key={idx} className="text-xs bg-red-100 dark:bg-red-900 p-2 rounded">
                  <div className="font-medium">{error.serviceName}</div>
                  <div className="text-red-800 dark:text-red-200">{error.error}</div>
                  {error.suggestion && (
                    <div className="text-red-600 dark:text-red-300 italic">
                      {error.suggestion}
                    </div>
                  )}
                </div>
              ))}
              {importResult.errors.length > 5 && (
                <div className="text-xs text-muted-foreground">
                  ... i još {importResult.errors.length - 5} greške
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </CardContent>
  </Card>
)}

      {/* Instructions */}
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <AlertCircle className="h-5 w-5 text-blue-500" />
      Uputstva
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-3 text-sm text-muted-foreground">
      <div className="flex items-start gap-2">
        <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
        <div>
          <strong>Format fajla:</strong> Excel (.xlsx ili .xls) sa pivot tabelom
        </div>
      </div>
      <div className="flex items-start gap-2">
        <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
        <div>
          <strong>Sheet 4:</strong> Mora sadržati "NTHDCB Standard - prepaid" podatke
        </div>
      </div>
      <div className="flex items-start gap-2">
        <Info className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
        <div>
          <strong>Čuvanje:</strong> Fajl se ne čuva - samo se loguju transakcije u bazu
        </div>
      </div>
      <div className="flex items-start gap-2">
        <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
        <div>
          <strong>Format tabele:</strong> Datumi u kolonama, servisi u redovima
        </div>
      </div>
      <div className="flex items-start gap-2">
        <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
        <div>
          <strong>Auto-kreiranje:</strong> Novi servisi se automatski kreiraju i linkuju u contract
        </div>
      </div>
      <div className="flex items-start gap-2">
        <XCircle className="h-4 w-4 mt-0.5 text-red-500 flex-shrink-0" />
        <div>
          <strong>Stop na postpaid:</strong> Import se automatski zaustavlja na "postpaid" sekciji
        </div>
      </div>
    </div>
  </CardContent>
</Card>
    </div>
  );
}