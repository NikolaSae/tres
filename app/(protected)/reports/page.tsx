//  \app\(protected)\reports\page.tsx

"use client";

import React from "react";
import Head from "next/head";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, FileText, Clock, BarChart, Building2, Download, Eye, FileIcon } from "lucide-react";
import { HumanitarianTemplateGenerator } from "@/components/reports/HumanitarianTemplateGenerator";
import HumanitarianFileUploader from "@/components/reports/HumanitarianFileUploader";
import { TemplateValidator } from "@/components/reports/TemplateValidator";
import ReportScanner from "@/components/reports/ReportScanner";
import { ClientGeneratedReport } from "@/components/reports/ClientGeneratedReport";
import { getRecentReports, getGeneratedHumanitarianReports } from "@/actions/reports/get-recent-reports";

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
  organization?: {
    name: string;
  };
  organizationName?: string;
  status?: "success" | "error";
  data?: any;
}

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

export default function ReportsPage() {
  const [recentReports, setRecentReports] = React.useState<ReportFile[]>([]);
  const [generatedReports, setGeneratedReports] = React.useState<GeneratedHumanitarianReport[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchReports() {
      try {
        let recent = await getRecentReports();
        recent = recent.map((r) => ({
          ...r,
          organizationName: r.organization?.name || "Unknown Organization",
          status: "success",
        }));
        setRecentReports(recent);

        const generated = await getGeneratedHumanitarianReports();
        setGeneratedReports(generated);
      } catch (err: any) {
        console.error("Error fetching reports:", err);
        setError(err?.message || "Failed to load reports");
      }
    }
    fetchReports();
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatFileName = (fileName: string, organizationName: string, generatedAt: Date) => {
    try {
      const extension = fileName.split(".").pop() || "";
      const cleanName = organizationName.replace(/[^a-zA-Z0-9А-Яа-яёЁ\s]/g, "_").replace(/\s+/g, "_");
      const datePart = generatedAt.toLocaleDateString("sr-RS").replace(/\./g, "_");
      return extension ? `${cleanName}_${datePart}.${extension}` : `${cleanName}_${datePart}`;
    } catch {
      return fileName;
    }
  };

  const getFileUrl = (filePath: string, fileName: string) =>
    filePath?.startsWith("/reports/") ? filePath : `/reports/generated/${fileName}`;

  return (
    <>
      <Head>
        <title>Reports | Dashboard</title>
        <meta name="description" content="Generate and manage custom reports" />
      </Head>
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground">Generate custom reports and access scheduled reports</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/reports/scheduled">
                <Clock className="mr-2 h-4 w-4" /> Scheduled Reports
              </Link>
            </Button>
            <Button asChild>
              <Link href="/reports/generate">
                <FileText className="mr-2 h-4 w-4" /> Create New Report
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

          {/* ---------------- Recent Reports Tab ---------------- */}
          <TabsContent value="recent" className="space-y-4">
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileIcon className="h-5 w-5" /> Imported JSON
                </CardTitle>
                <CardDescription>Recently imported JSON counter files</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentReports.filter((r) => r.fileName.endsWith(".json")).length > 0 ? (
                  recentReports
                    .filter((r) => r.fileName.endsWith(".json"))
                    .map((report) => (
                      <div
                        key={report.id}
                        className="border rounded-lg p-4 hover:bg-muted/20 transition-colors"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-foreground">{report.fileName}</span>
                          <div className="flex gap-2">
                            <Button size="sm" asChild variant="outline">
                              <a href={report.filePath} target="_blank">
                                <Eye className="h-3 w-3 mr-1" /> View
                              </a>
                            </Button>
                            <Button size="sm" asChild variant="outline">
                              <a href={report.filePath} download={report.fileName}>
                                <Download className="h-3 w-3 mr-1" /> Download
                              </a>
                            </Button>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Size: {formatFileSize(report.fileSize)} • Uploaded:{" "}
                          {new Date(report.uploadedAt).toLocaleDateString("sr-RS")}
                        </span>

                        {report.data?.processedOrganizations?.length > 0 ? (
                          <div className="mt-3 overflow-x-auto">
                            <table className="w-full text-xs border-collapse">
                              <thead>
                                <tr className="bg-gray-100 dark:bg-gray-800">
                                  <th className="border px-2 py-1 text-left">Organization</th>
                                  <th className="border px-2 py-1 text-right">Value</th>
                                  <th className="border px-2 py-1 text-right">Counter</th>
                                  <th className="border px-2 py-1 text-right">Timestamp</th>
                                </tr>
                              </thead>
                              <tbody>
                                {report.data.processedOrganizations.map((org: any, idx: number) => (
                                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                                    <td className="border px-2 py-1">{org.name}</td>
                                    <td className="border px-2 py-1 text-right">{org.value}</td>
                                    <td className="border px-2 py-1 text-right">{org.counterAssigned}</td>
                                    <td className="border px-2 py-1 text-right">
                                      {new Date(org.timestamp).toLocaleString("sr-RS")}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-center py-4 space-y-2">
                            <FileIcon className="h-10 w-10 text-muted-foreground/50" />
                            <span className="text-sm text-muted-foreground">
                              No organizations processed yet
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-8 space-y-3">
                    <FileIcon className="h-12 w-12 text-muted-foreground/50" />
                    <div className="text-lg font-medium text-muted-foreground">
                      No JSON reports imported yet
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------------- Humanitarian Templates Tab ---------------- */}
          <TabsContent value="humanitarian" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" /> Humanitarian Organization Templates
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
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5" /> All Humanitarian Reports Archive
                </CardTitle>
                <CardDescription>
                  Browse and filter all reports stored in the public/reports directory
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ReportScanner />
              </CardContent>
            </Card>
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileIcon className="h-5 w-5" /> Generated Humanitarian Reports
                  {generatedReports.length > 0 && (
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-sm font-normal">
                      {generatedReports.length}
                    </span>
                  )}
                </CardTitle>
                <CardDescription>Recently generated humanitarian report templates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {generatedReports.length > 0 ? (
                  generatedReports.map((report) => {
                    const fileUrl = getFileUrl(report.filePath, report.fileName);
                    const formattedFileName = formatFileName(
                      report.fileName,
                      report.organizationName,
                      report.generatedAt
                    );

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
                              Generated:{" "}
                              {new Date(report.generatedAt).toLocaleDateString("sr-RS")}{" "}
                              {new Date(report.generatedAt).toLocaleTimeString("sr-RS")}
                            </span>
                          </div>
                        </div>
                        <ClientGeneratedReport fileUrl={fileUrl} fileName={formattedFileName} />
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
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------------- Upload Tab ---------------- */}
          <TabsContent value="upload">
            <HumanitarianFileUploader />
          </TabsContent>

          {/* ---------------- Validation Tab ---------------- */}
          <TabsContent value="validation">
            <TemplateValidator />
          </TabsContent>

          {/* ---------------- Financial Tab ---------------- */}
          <TabsContent value="financial">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Financial Reports</h2>
              <p className="text-muted-foreground mb-4">
                Generate reports for revenue, payments, and financial performance
              </p>
              <Button variant="outline">
                <BarChart className="mr-2 h-4 w-4" /> Generate Financial Report
              </Button>
            </Card>
          </TabsContent>

          {/* ---------------- Operations Tab ---------------- */}
          <TabsContent value="operations">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Operations Reports</h2>
              <p className="text-muted-foreground mb-4">
                Generate reports for services, complaints, and operational metrics
              </p>
              <Button variant="outline">
                <BarChart className="mr-2 h-4 w-4" /> Generate Operations Report
              </Button>
            </Card>
          </TabsContent>

          {/* ---------------- Contracts Tab ---------------- */}
          <TabsContent value="contracts">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Contract Reports</h2>
              <p className="text-muted-foreground mb-4">
                Generate reports for contract status, expiration, and renewal tracking
              </p>
              <Button variant="outline">
                <BarChart className="mr-2 h-4 w-4" /> Generate Contract Report
              </Button>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
