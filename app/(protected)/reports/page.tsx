// app/(protected)/reports/page.tsx

import { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRecentReports } from "@/actions/reports/get-recent-reports";
import { CalendarIcon, FileText, Clock, BarChart, Building2, Download, RotateCcw, Users, Upload, Settings } from "lucide-react";
import { ReportPreview } from "@/components/reports/ReportPreview";
import { HumanitarianTemplateGenerator } from "@/components/reports/HumanitarianTemplateGenerator";
import { HumanitarianFileUploader } from "@/components/reports/HumanitarianFileUploader";
import { MonthlyCounterReset } from "@/components/reports/MonthlyCounterReset";
import { TemplateValidator } from "@/components/reports/TemplateValidator";
import { format } from "date-fns";

export const metadata: Metadata = {
  title: "Reports | Dashboard",
  description: "Generate and manage custom reports",
};

export default async function ReportsPage() {
  // This would typically fetch recent reports from your database
  const recentReports = await getRecentReports();

  return (
    <div className="flex flex-col gap-5">
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

        <TabsContent value="recent" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentReports && recentReports.length > 0 ? (
              recentReports.map((report) => (
                <ReportPreview key={report.id} report={report} />
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

        <TabsContent value="humanitarian" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Humanitarian Organization Templates
              </CardTitle>
              <CardDescription>
                Generate monthly report templates for all humanitarian organizations. 
                Templates will be created with organization data and saved in their respective report folders.
                System supports Excel formatting preservation through multiple methods (ExcelJS, Python, manual copy).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HumanitarianTemplateGenerator />
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

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                File Upload Management
              </CardTitle>
              <CardDescription>
                Upload and process humanitarian organization files and reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HumanitarianFileUploader />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Validation
              </CardTitle>
              <CardDescription>
                Validate that all required components for template generation are available and working
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TemplateValidator />
            </CardContent>
          </Card>

          {/* Additional validation info */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Template Generation Methods</CardTitle>
                <CardDescription>
                  Available methods for generating Excel templates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <div className="flex items-center justify-between p-2 rounded border">
                    <span>ExcelJS Library</span>
                    <span className="text-xs text-muted-foreground">Best formatting preservation</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded border">
                    <span>Python + openpyxl</span>
                    <span className="text-xs text-muted-foreground">Fallback method</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded border">
                    <span>Simple File Copy</span>
                    <span className="text-xs text-muted-foreground">Manual data insertion</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">System Requirements</CardTitle>
                <CardDescription>
                  Dependencies needed for full functionality
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm space-y-1">
                  <div>• Master template file in /templates/</div>
                  <div>• Write permissions for /reports/</div>
                  <div>• ExcelJS npm package (optional)</div>
                  <div>• Python3 + openpyxl (optional)</div>
                  <div>• Database connection</div>
                  <div>• Active humanitarian organizations</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Financial Reports</h2>
            <p className="text-muted-foreground mb-4">
              Generate reports for revenue, payments, and financial performance
            </p>
            {/* Financial report templates would go here */}
          </Card>
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Operations Reports</h2>
            <p className="text-muted-foreground mb-4">
              Generate reports for services, complaints, and operational metrics
            </p>
            {/* Operations report templates would go here */}
          </Card>
        </TabsContent>

        <TabsContent value="contracts" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Contract Reports</h2>
            <p className="text-muted-foreground mb-4">
              Generate reports for contract status, expiration, and renewal tracking
            </p>
            {/* Contract report templates would go here */}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}