// app/(protected)/admin/complaints/reports/page.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ExcelExport } from "@/components/complaints/reports/ExcelExport";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Download, FileText, RefreshCcw, Filter, List } from "lucide-react";
import { DateRangeFilter } from "@/components/complaints/DateRangeFilter";
import { NotificationBanner } from "@/components/complaints/NotificationBanner";
import Link from "next/link";
import { UINotificationState, UINotifications, CommonUINotifications } from "@/lib/types/ui-notification-types";

// Mock data for reports - in a real implementation these would come from an API
const REPORTS = [
  { id: '1', name: 'Monthly Complaint Summary', type: 'monthly', date: '2025-03-31', status: 'Ready', url: '#' },
  { id: '2', name: 'Service Category Analysis', type: 'custom', date: '2025-04-15', status: 'Ready', url: '#' },
  { id: '3', name: 'Provider Performance Report', type: 'weekly', date: '2025-04-20', status: 'Ready', url: '#' },
  { id: '4', name: 'Q1 Financial Impact Report', type: 'quarterly', date: '2025-04-01', status: 'Processing', url: null },
  { id: '5', name: 'Response Time Analysis', type: 'custom', date: '2025-04-18', status: 'Ready', url: '#' },
];

// Mock data for scheduled reports
const SCHEDULED_REPORTS = [
  { id: '1', name: 'Weekly Status Overview', frequency: 'WEEKLY', lastRun: '2025-04-18', nextRun: '2025-04-25', status: 'Active' },
  { id: '2', name: 'Monthly Financial Summary', frequency: 'MONTHLY', lastRun: '2025-03-31', nextRun: '2025-04-30', status: 'Active' },
  { id: '3', name: 'Quarterly Performance Review', frequency: 'QUARTERLY', lastRun: '2025-03-31', nextRun: '2025-06-30', status: 'Active' },
  { id: '4', name: 'Daily Urgent Complaints', frequency: 'DAILY', lastRun: '2025-04-24', nextRun: '2025-04-25', status: 'Paused' },
];

export default function ComplaintsReportsPage() {
  const [activeTab, setActiveTab] = useState("generated");
  const [filterOpen, setFilterOpen] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    endDate: new Date()
  });
  const [reportType, setReportType] = useState("all");
  
  // Uses UINotificationState
  const [notification, setNotification] = useState<UINotificationState | null>(null);
  
  const [isExporting, setIsExporting] = useState(false);

  const handleDateRangeChange = (startDate: Date | undefined, endDate: Date | undefined) => {
    setDateRange({
      startDate: startDate || new Date(),
      endDate: endDate || new Date()
    });
  };

  const handleGenerateReport = async () => {
    try {
      setIsExporting(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setNotification(
        UINotifications.success(
          "Report Generated",
          "Report generated successfully. It will appear in the list when ready."
        )
      );
    } catch (error) {
      setNotification(
        UINotifications.error(
          "Generation Failed",
          "Failed to generate report. Please try again."
        )
      );
    } finally {
      setIsExporting(false);
    }
  };

  const filteredReports = reportType === "all" 
    ? REPORTS 
    : REPORTS.filter(report => report.type === reportType);

  return (
    <div className="container mx-auto p-6 top-0">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Complaint Reports</h1>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setFilterOpen(!filterOpen)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          
          <Link href="/admin/complaints/statistics">
            <Button variant="default">
              View Statistics
            </Button>
          </Link>
        </div>
      </div>
      
      {notification && (
        <NotificationBanner
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
      
      {filterOpen && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Report Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DateRangeFilter
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                onChange={handleDateRangeChange}
              />
              
              <div>
                <label className="text-sm font-medium mb-1 block">Report Type</label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Reports</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="mt-4">
              <Button
                onClick={handleGenerateReport}
                disabled={isExporting}
                className="w-full md:w-auto"
              >
                {isExporting ? (
                  <>
                    <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Custom Report
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="generated">
            <FileText className="h-4 w-4 mr-2" />
            Generated Reports
          </TabsTrigger>
          <TabsTrigger value="scheduled">
            <Calendar className="h-4 w-4 mr-2" />
            Scheduled Reports
          </TabsTrigger>
          <TabsTrigger value="export">
            <Download className="h-4 w-4 mr-2" />
            Custom Export
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="generated">
          <Card>
            <CardHeader>
              <CardTitle>Generated Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Generated</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredReports.map((report) => (
                      <tr key={report.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{report.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{report.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            report.status === 'Ready' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {report.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {report.status === 'Ready' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <Link href={report.url || '#'}>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Link>
                            </Button>
                          ) : (
                            <span className="text-sm text-gray-500">Processing...</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    
                    {filteredReports.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                          No reports found matching your criteria
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="scheduled">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Run</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Run</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {SCHEDULED_REPORTS.map((report) => (
                      <tr key={report.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{report.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.frequency}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.lastRun}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.nextRun}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            report.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {report.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <Button
                            variant="outline"
                            size="sm"
                          >
                            {report.status === 'Active' ? 'Pause' : 'Activate'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle>Custom Data Export</CardTitle>
            </CardHeader>
            <CardContent>
              <ExcelExport 
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}