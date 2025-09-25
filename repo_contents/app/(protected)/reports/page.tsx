// app/(protected)/reports/page.tsx
import { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRecentReports } from "@/actions/reports/get-recent-reports";
import { CalendarIcon, FileText, Clock, BarChart } from "lucide-react";
// CORRECTED: Use named import for ReportPreview
import { ReportPreview } from "@/components/reports/ReportPreview";
import { format } from "date-fns"; // Import format for date display if needed elsewhere

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