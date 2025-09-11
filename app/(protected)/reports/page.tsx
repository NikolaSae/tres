// app/(protected)/reports/page.tsx
import { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRecentReports } from "@/actions/reports/get-recent-reports";
import { CalendarIcon, FileText, Clock, BarChart, Building2, Download, RotateCcw, Users, Upload, Settings } from "lucide-react";
import { HumanitarianTemplateGenerator } from "@/components/reports/HumanitarianTemplateGenerator";
import { HumanitarianFileUploader } from "@/components/reports/HumanitarianFileUploader";
import { MonthlyCounterReset } from "@/components/reports/MonthlyCounterReset";
import { TemplateValidator } from "@/components/reports/TemplateValidator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Reports | Dashboard",
  description: "Generate and manage custom reports",
};

// Define the report interface to match what getRecentReports returns
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
  // Add computed properties for backward compatibility
  organizationName?: string;
  status?: 'success' | 'error';
}

export default async function ReportsPage() {
  let recentReports: ReportFile[] = [];
  let error: string | null = null;

  try {
    recentReports = await getRecentReports();
    // Add computed properties for backward compatibility
    recentReports = recentReports.map(report => ({
      ...report,
      organizationName: report.organization?.name || 'Unknown Organization',
      status: 'success' as const // Assume success if we can read the report
    }));
  } catch (err) {
    console.error('Error fetching recent reports:', err);
    error = err instanceof Error ? err.message : 'Failed to load recent reports';
  }

  const formatFileName = (report: ReportFile) => {
    if (!report.fileName) return "Untitled Report";
    
    try {
      const extension = report.fileName.split(".").pop() || '';
      const cleanName = (report.organizationName || 'Unknown')
        .replace(/[^a-zA-Z0-9А-Яа-яёЁ\s]/g, "_")
        .replace(/\s+/g, "_");
      
      // Try to extract date from filename or use upload date
      const datePart = report.fileName.match(/\d{2}_\d{4}/)?.[0] || 
        report.uploadedAt.toLocaleDateString('sr-RS').replace(/\./g, '_');
      
      return extension ? `${cleanName}_${datePart}.${extension}` : `${cleanName}_${datePart}`;
    } catch (err) {
      console.error('Error formatting filename:', err);
      return report.fileName;
    }
  };

  const getFileUrl = (report: ReportFile) => {
    // Ensure the file path is properly formatted for web access
    if (report.filePath.startsWith('/reports/')) {
      return report.filePath;
    }
    return `/reports/files/${report.fileName}`;
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

        {/* ---------------- Recent Reports ---------------- */}
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
                        {formatFileName(report)}
                      </span>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Size: {(report.fileSize / 1024).toFixed(1)} KB
                      <br />
                      Uploaded: {report.uploadedAt.toLocaleDateString('sr-RS')}
                    </div>
                    <div className="flex gap-2 mt-2">
                      {report.fileName && (
                        <>
                          <Button size="sm" asChild variant="outline">
                            <Link
                              href={getFileUrl(report)}
                              target="_blank"
                            >
                              View
                            </Link>
                          </Button>
                          <Button size="sm" asChild variant="outline">
                            <a
                              href={getFileUrl(report)}
                              download={formatFileName(report)}
                            >
                              Download
                            </a>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const printWindow = window.open(
                                getFileUrl(report),
                                "_blank"
                              );
                              if (printWindow) {
                                printWindow.onload = () => printWindow.print();
                              }
                            }}
                          >
                            Print
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
                    Generate a new report to see it here.
                  </div>
                  <Button className="mt-4" asChild>
                    <Link href="/reports/generate">Create Report</Link>
                  </Button>
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

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Generated Humanitarian Reports</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentReports.length > 0 ? (
                recentReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-2 border rounded hover:bg-muted/20 transition"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{report.organizationName}</span>
                      <span
                        className={`text-sm font-medium ${
                          report.status === "success"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {report.status === "success" ? "Uspešno" : "Greška"}
                      </span>
                      {report.fileName && (
                        <span className="text-xs text-muted-foreground">
                          {formatFileName(report)}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {report.fileName && (
                        <>
                          <Button size="sm" asChild variant="outline">
                            <Link
                              href={getFileUrl(report)}
                              target="_blank"
                            >
                              View
                            </Link>
                          </Button>
                          <Button size="sm" asChild variant="outline">
                            <a
                              href={getFileUrl(report)}
                              download={formatFileName(report)}
                            >
                              Download
                            </a>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const printWindow = window.open(
                                getFileUrl(report),
                                "_blank"
                              );
                              if (printWindow) {
                                printWindow.onload = () => printWindow.print();
                              }
                            }}
                          >
                            Print
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">
                  No reports generated yet.
                </div>
              )}
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