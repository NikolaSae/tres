// app/(protected)/admin/complaints/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ComplaintList } from "@/components/complaints/ComplaintList";
import { ComplaintFilters } from "@/components/complaints/ComplaintFilters";
import { StatisticsCard } from "@/components/complaints/StatisticsCard";
import { NotificationBanner } from "@/components/complaints/NotificationBanner";
import { useComplaints } from "@/hooks/use-complaints";
import { useServiceCategories } from "@/hooks/use-service-categories";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  Upload, 
  RefreshCcw, 
  AlertTriangle, 
  CheckCircle, 
  Clock 
} from "lucide-react";
import Link from "next/link";
import { CsvImport } from "@/components/complaints/CsvImport";
import { exportComplaints } from "@/actions/complaints/export";

export default function AdminComplaintsPage() {
  const searchParams = useSearchParams();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // Extract filter parameters from URL
  const status = searchParams.get("status") || "";
  const priority = searchParams.get("priority") || "";
  const service = searchParams.get("service") || "";
  const provider = searchParams.get("provider") || "";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";
  const search = searchParams.get("search") || "";

  // Fetch data
  const parsedPriority = priority ? parseInt(priority, 10) : undefined;
  const priorityValue = !isNaN(parsedPriority) && parsedPriority !== null ? parsedPriority : undefined;

  const { complaints, isLoading, error, mutate } = useComplaints({
  status,
  priority: priorityValue,
  serviceId: service,
  providerId: provider,
  startDate: startDate ? new Date(startDate) : undefined,
  endDate: endDate ? new Date(endDate) : undefined,
  search
});
  
  const { categories: serviceCategories } = useServiceCategories();

  // Calculate statistics
  const stats = {
    total: complaints?.length || 0,
    unresolved: complaints?.filter(c => c.status !== "RESOLVED" && c.status !== "CLOSED").length || 0,
    urgent: complaints?.filter(c => c.priority === 1 || c.priority === 2).length || 0,
    avgResponseTime: "24h" // This would ideally be calculated from actual data
  };

  const handleExport = async () => {
    try {
      await exportComplaints({
        status,
        priority: priority ? parseInt(priority) : undefined,
        serviceId: service,
        providerId: provider,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        search
      });
      
      setNotification({
        type: "success",
        message: "Export started. The file will be available for download shortly."
      });
    } catch (err) {
      console.error("Export error:", err);
      setNotification({
        type: "error",
        message: "Failed to export complaints"
      });
    }
  };

  const handleImportComplete = (success: boolean, message: string) => {
    setIsImportModalOpen(false);
    
    if (success) {
      setNotification({
        type: "success",
        message
      });
      mutate(); // Refresh the data
    } else {
      setNotification({
        type: "error",
        message
      });
    }
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <NotificationBanner
          type="error"
          message="Failed to load complaints"
          onClose={() => {}}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 top-0">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Complaint Management</h1>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsImportModalOpen(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          
          <Button
            variant="outline"
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Button onClick={() => mutate()}>
  <RefreshCcw className="h-4 w-4 mr-2" />
  Refresh
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
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatisticsCard
          title="Total Complaints"
          value={stats.total}
          icon={<CheckCircle className="h-8 w-8 text-blue-500" />}
          colorClass="bg-blue-50 border-blue-200"
        />
        
        <StatisticsCard
          title="Unresolved"
          value={stats.unresolved}
          icon={<Clock className="h-8 w-8 text-amber-500" />}
          colorClass="bg-amber-50 border-amber-200"
        />
        
        <StatisticsCard
          title="Urgent Cases"
          value={stats.urgent}
          icon={<AlertTriangle className="h-8 w-8 text-red-500" />}
          colorClass="bg-red-50 border-red-200"
        />
        
        <StatisticsCard
          title="Avg. Response Time"
          value={stats.avgResponseTime}
          icon={<Clock className="h-8 w-8 text-green-500" />}
          colorClass="bg-green-50 border-green-200"
        />
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <ComplaintFilters />
      </div>
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <ComplaintList
          complaints={complaints || []}
          isLoading={isLoading}
          isAdminView={true}
        />
      </div>
      
      {isImportModalOpen && (
        <CsvImport
          onClose={() => setIsImportModalOpen(false)}
          onComplete={handleImportComplete}
        />
      )}
    </div>
  );
}