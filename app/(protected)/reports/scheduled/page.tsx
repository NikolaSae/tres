///app/(protected)/reports/scheduled/page.tsx


import { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, Calendar, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getScheduledReports } from "@/actions/reports/get-scheduled-reports";
import ScheduleForm from "@/components/reports/ScheduleForm";

export const metadata: Metadata = {
  title: "Scheduled Reports | Dashboard",
  description: "Manage and schedule automatic report generation",
};

export default async function ScheduledReportsPage() {
  // This would typically fetch scheduled reports from your database
  const scheduledReports = await getScheduledReports();
  
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 mb-2">
        <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
          <Link href="/reports">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Scheduled Reports</h1>
          <p className="text-muted-foreground">
            Manage and configure automatically generated reports
          </p>
        </div>
        <Button asChild>
          <Link href="/reports/scheduled/new">
            <Plus className="mr-2 h-4 w-4" />
            New Schedule
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">Active Schedules</TabsTrigger>
          <TabsTrigger value="history">Run History</TabsTrigger>
          <TabsTrigger value="create">Create Schedule</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="space-y-4">
          {scheduledReports && scheduledReports.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {scheduledReports.map((report) => (
                <Card key={report.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle>{report.name}</CardTitle>
                      <div className={`px-2 py-1 rounded text-xs ${
                        report.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {report.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                    <CardDescription>{report.reportType}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>Frequency: {report.frequency.toLowerCase()}</span>
                      </div>
                      {report.lastRun && (
                        <div className="flex items-center text-sm">
                          <CheckCircle className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>Last run: {new Date(report.lastRun).toLocaleString()}</span>
                        </div>
                      )}
                      {report.nextRun && (
                        <div className="flex items-center text-sm">
                          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>Next run: {new Date(report.nextRun).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 flex justify-end space-x-2">
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button variant="outline" size="sm" className={
                        report.isActive ? 'text-red-500 hover:text-red-600' : 'text-green-500 hover:text-green-600'
                      }>
                        {report.isActive ? 'Disable' : 'Enable'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-6">
              <div className="flex flex-col items-center justify-center text-center space-y-2">
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
                <div className="text-xl font-medium">No scheduled reports</div>
                <div className="text-muted-foreground">
                  Create a new scheduled report to see it here.
                </div>
                <Button className="mt-4" asChild>
                  <Link href="/reports/scheduled/new">Create Schedule</Link>
                </Button>
              </div>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Report Generation History</h2>
            {/* Report generation history would go here */}
          </Card>
        </TabsContent>
        
        <TabsContent value="create" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Create Scheduled Report</h2>
            <ScheduleForm />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}