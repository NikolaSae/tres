// app/(protected)/reports/page.tsx

import { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRecentReports, getGeneratedHumanitarianReports } from "@/actions/reports/get-recent-reports";
import { CalendarIcon, FileText, Clock, BarChart, Building2, Download, RotateCcw, Users, Upload, Settings, Eye, Printer, FileIcon } from "lucide-react";
import { HumanitarianTemplateGenerator } from "@/components/reports/HumanitarianTemplateGenerator";
import  HumanitarianFileUploader  from "@/components/reports/HumanitarianFileUploader";
import { MonthlyCounterReset } from "@/components/reports/MonthlyCounterReset";
import { TemplateValidator } from "@/components/reports/TemplateValidator";
import  ReportScanner  from "@/components/reports/ReportScanner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Reports | Dashboard",
  description: "Generate and manage custom reports",
};

// Interface for file uploads (Recent Reports tab)
interface ReportFile {
  id: string;
  fileName: string;
  filePath: string;
  organizationId: string;
  startDate: Date;
  endDate: Date;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  organization: {
    name: string;
  };
  organizationName?: string;
  status?: 'success' | 'error';
}

// Interface for generated humanitarian reports
interface GeneratedHumanitarianReport {
  id: string;
  organizationName: string;
  status: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  generatedAt: Date;
  reportType: string;
  month?: number;
  year?: number;
}

export default async function ReportsPage() {
  let recentReports: ReportFile[] = [];
  let generatedReports: GeneratedHumanitarianReport[] = [];
  let error: string | null = null;

  try {
    // Dobijamo file uploads za Recent Reports tab
    recentReports = await getRecentReports();
    recentReports = recentReports.map(report => ({
      ...report,
      organizationName: report.organization?.name || 'Unknown Organization',
      status: 'success' as const
    }));

    // Dobijamo generisane humanitarian izveštaje
    generatedReports = await getGeneratedHumanitarianReports();
  } catch (err) {
    console.error('Error fetching reports:', err);
    error = err instanceof Error ? err.message : 'Failed to load reports';
  }

  const formatFileName = (fileName: string, organizationName: string, generatedAt: Date) => {
    if (!fileName) return "Untitled Report";
    
    try {
      const extension = fileName.split(".").pop() || '';
      const cleanName = organizationName
        .replace(/[^a-zA-Z0-9А-Яа-яёЁ\s]/g, "_")
        .replace(/\s+/g, "_");
      
      const datePart = generatedAt.toLocaleDateString('sr-RS').replace(/\./g, '_');
      
      return extension ? `${cleanName}_${datePart}.${extension}` : `${cleanName}_${datePart}`;
    } catch (err) {
      console.error('Error formatting filename:', err);
      return fileName;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileUrl = (filePath: string, fileName: string) => {
    if (filePath && filePath.startsWith('/reports/')) {
      return filePath;
    }
    return `/reports/generated/${fileName}`;
  };

  const handlePreview = (fileUrl: string, fileName: string) => {
    const previewWindow = window.open(fileUrl, '_blank');
    if (previewWindow) {
      previewWindow.document.title = fileName;
    }
  };

  const handlePrint = (fileUrl: string) => {
    const printWindow = window.open(fileUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* ---------------- Header ---------------- */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Generate custom reports and access scheduled reports
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/reports/scheduled">
              <Clock className="mr-2 h-4 w-4" />
              Scheduled Reports
            </Link>
          </Button>
          <Button asChild>
            <Link href="/reports/generate">
              <FileText className="mr-2 h-4 w-4" />
              Create New Report
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="recent" className="w-full">
        <TabsList>
          <TabsTrigger value="recent">Recent Reports</TabsTrigger>
          <TabsTrigger value="humanitarian">Humanitarian Templates</TabsTrigger>
          <TabsTrigger value="upload">File Upload</TabsTrigger>
          <TabsTrigger value="validation">System Validation</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
        </TabsList>

        {/* ---------------- Recent Reports (File Uploads) ---------------- */}
        <TabsContent value="recent" className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentReports.length > 0 ? (
              recentReports.map((report) => (
                <Card key={report.id} className="p-4">
                  <CardHeader>
                    <CardTitle>{report.organizationName}</CardTitle>
                    <CardDescription>
                      <span
                        className={`${
                          report.status === "success"
                            ? "text-green-600"
                            : "text-red-600"
                        } font-medium`}
                      >
                        {report.status === "success" ? "Uspešno" : "Greška"}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    {report.fileName && (
                      <span className="text-sm text-muted-foreground">
                        {report.fileName}
                      </span>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Size: {formatFileSize(report.fileSize)}
                      <br />
                      Uploaded: {report.uploadedAt.toLocaleDateString('sr-RS')}
                    </div>
                    <div className="flex gap-2 mt-2">
                      {report.fileName && (
                        <>
                          <Button size="sm" asChild variant="outline">
                            <Link
                              href={report.filePath}
                              target="_blank"
                            >
                              <Eye className="mr-1 h-3 w-3" />
                              View
                            </Link>
                          </Button>
                          <Button size="sm" asChild variant="outline">
                            <a
                              href={report.filePath}
                              download={report.fileName}
                            >
                              <Download className="mr-1 h-3 w-3" />
                              Download
                            </a>
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="col-span-full p-6">
                <div className="flex flex-col items-center justify-center text-center space-y-2">
                  <BarChart className="h-8 w-8 text-muted-foreground" />
                  <div className="text-xl font-medium">No recent reports</div>
                  <div className="text-muted-foreground">
                    Upload a report to see it here.
                  </div>
                </div>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ---------------- Humanitarian Templates ---------------- */}
        <TabsContent value="humanitarian" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Humanitarian Organization Templates
              </CardTitle>
              <CardDescription>
                Generate monthly report templates for all humanitarian organizations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HumanitarianTemplateGenerator />
            </CardContent>
          </Card>

          {/* Generated Humanitarian Reports Section */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileIcon className="h-5 w-5" />
                Generated Humanitarian Reports
                {generatedReports.length > 0 && (
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-sm font-normal">
                    {generatedReports.length}
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                Recently generated humanitarian report templates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {generatedReports.length > 0 ? (
                generatedReports.map((report) => {
                  const fileUrl = getFileUrl(report.filePath, report.fileName);
                  const formattedFileName = formatFileName(report.fileName, report.organizationName, report.generatedAt);
                  
                  return (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/20 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <FileText className="h-8 w-8 text-blue-500" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-foreground truncate">
                            {report.organizationName}
                          </span>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                                report.status === "success"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {report.status === "success" ? "✓ Generisan" : "✗ Greška"}
                            </span>
                            {report.month && report.year && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                {report.month}/{report.year}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground mt-1">
                            {formattedFileName} • {formatFileSize(report.fileSize)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Generated: {report.generatedAt.toLocaleDateString('sr-RS')} {report.generatedAt.toLocaleTimeString('sr-RS')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handlePreview(fileUrl, formattedFileName)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          Preview
                        </Button>
                        <Button size="sm" asChild variant="outline">
                          <a
                            href={fileUrl}
                            download={formattedFileName}
                            className="flex items-center gap-1"
                          >
                            <Download className="h-3 w-3" />
                            Download
                          </a>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePrint(fileUrl)}
                          className="flex items-center gap-1"
                        >
                          <Printer className="h-3 w-3" />
                          Print
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-8 space-y-3">
                  <FileIcon className="h-12 w-12 text-muted-foreground/50" />
                  <div className="text-lg font-medium text-muted-foreground">
                    No reports generated yet
                  </div>
                  <div className="text-sm text-muted-foreground max-w-sm">
                    Use the template generator above to create humanitarian organization reports. 
                    Generated reports will appear here with options to preview, download, and print.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* All Reports Scanner Section */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                All Humanitarian Reports Archive
              </CardTitle>
              <CardDescription>
                Browse and filter all reports stored in the public/reports directory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReportScanner />
            </CardContent>
          </Card>

          {/* Management cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Template Status</CardTitle>
                <CardDescription>
                  View the status of generated templates by organization and month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <FileText className="mr-2 h-4 w-4" />
                  View Template Status
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Master Template</CardTitle>
                <CardDescription>
                  Download the master XLSX template or check its status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Download Master Template
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Path: /templates/humanitarian-template.xlsx
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Counter Management</CardTitle>
                <CardDescription>
                  Reset monthly counters for organizations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MonthlyCounterReset />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ---------------- Upload ---------------- */}
        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                File Upload Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <HumanitarianFileUploader />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- Validation ---------------- */}
        <TabsContent value="validation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Validation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TemplateValidator />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- Financial ---------------- */}
        <TabsContent value="financial" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Financial Reports</h2>
            <p className="text-muted-foreground mb-4">
              Generate reports for revenue, payments, and financial performance
            </p>
            <Button variant="outline">
              <BarChart className="mr-2 h-4 w-4" />
              Generate Financial Report
            </Button>
          </Card>
        </TabsContent>

        {/* ---------------- Operations ---------------- */}
        <TabsContent value="operations" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Operations Reports</h2>
            <p className="text-muted-foreground mb-4">
              Generate reports for services, complaints, and operational metrics
            </p>
            <Button variant="outline">
              <BarChart className="mr-2 h-4 w-4" />
              Generate Operations Report
            </Button>
          </Card>
        </TabsContent>

        {/* ---------------- Contracts ---------------- */}
        <TabsContent value="contracts" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Contract Reports</h2>
            <p className="text-muted-foreground mb-4">
              Generate reports for contract status, expiration, and renewal tracking
            </p>
            <Button variant="outline">
              <BarChart className="mr-2 h-4 w-4" />
              Generate Contract Report
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}