// app/(protected)/admin/complaints/page.tsx
// Sa UI notification types

"use client";

import { useState } from "react";
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
import { ComplaintStatus, UserRole } from "@prisma/client";
import { useSession } from "next-auth/react";
import { UINotificationState, UINotifications, CommonUINotifications } from "@/lib/types/ui-notification-types";

export default function AdminComplaintsPage() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  // Koristi UINotificationState
  const [notification, setNotification] = useState<UINotificationState | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const normalizeComplaint = (complaint: any) => ({
    ...complaint,
    providerId: complaint.providerId ?? null,
    humanitarianOrgId: complaint.humanitarianOrgId ?? null,
    parkingServiceId: complaint.parkingServiceId ?? null,
    serviceId: complaint.serviceId ?? null,
    productId: complaint.productId ?? null,
    assignedAgentId: complaint.assignedAgentId ?? null,
    financialImpact: complaint.financialImpact ?? null,
    assignedAt: complaint.assignedAt ?? null,
    resolvedAt: complaint.resolvedAt ?? null,
    closedAt: complaint.closedAt ?? null,
  });

  const status = searchParams.get("status") || "";
  const priority = searchParams.get("priority") || "";
  const service = searchParams.get("service") || "";
  const provider = searchParams.get("provider") || "";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";
  const search = searchParams.get("search") || "";

  const priorityValue = priority && !isNaN(Number(priority)) ? Number(priority) : undefined;

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

  const stats = {
    total: complaints?.length || 0,
    unresolved: complaints?.filter(c => c.status !== "RESOLVED" && c.status !== "CLOSED").length || 0,
    urgent: complaints?.filter(c => c.priority === 1 || c.priority === 2).length || 0,
    avgResponseTime: "24h"
  };

  const handleExport = async () => {
    try {
      await exportComplaints({
        format: "csv",
        statuses: status ? [status as ComplaintStatus] : undefined,
        serviceId: service || undefined,
        providerId: provider || undefined,
        dateRange: (startDate || endDate) ? {
          from: startDate ? new Date(startDate) : new Date(0),
          to: endDate ? new Date(endDate) : new Date(),
        } : undefined,
      });

      // Koristi predefinisanu success poruku
      setNotification(CommonUINotifications.exportSuccess());
    } catch (err) {
      console.error("Export error:", err);
      // Koristi predefinisanu error poruku
      setNotification(CommonUINotifications.exportError());
    }
  };

  const handleImportComplete = (success: boolean, message: string) => {
    setIsImportModalOpen(false);
    
    if (success) {
      // Custom success sa message parametrom
      setNotification(
        UINotifications.success("Import Successful", message)
      );
      mutate();
    } else {
      // Custom error sa message parametrom
      setNotification(
        UINotifications.error("Import Failed", message)
      );
    }
  };

  const handleFiltersChange = (filters: any) => {
    mutate();
  };

  const getUserRole = () => {
    if (session?.user && 'role' in session.user) {
      return (session.user as any).role;
    }
    return "USER";
  };

  const userRole = getUserRole();
  const isAdmin = userRole === UserRole.ADMIN;
  const isSupportAgent = userRole === UserRole.SUPPORT_AGENT;
  const canViewPage = isAdmin || isSupportAgent;

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <NotificationBanner
          type="error"
          title="Error"
          message="Failed to load complaints"
          onClose={() => {}}
        />
      </div>
    );
  }

  if (!canViewPage) {
    return (
      <div className="container mx-auto p-6">
        <NotificationBanner
          type="error"
          title="Access Denied"
          message="You don't have permission to access this page."
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
          {isAdmin && (
            <>
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
            </>
          )}
          
          <Button onClick={() => mutate()}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          {isAdmin && (
            <Link href="/admin/complaints/statistics">
              <Button variant="default">
                View Statistics
              </Button>
            </Link>
          )}
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
        <ComplaintFilters onFiltersChange={handleFiltersChange} />
      </div>
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <RefreshCcw className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-600">Loading complaints...</span>
          </div>
        ) : (
          <ComplaintList
            complaints={(complaints || []).map(normalizeComplaint)}
            totalComplaints={complaints?.length || 0}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            userRole={userRole}
          />
        )}
      </div>
      
      {isAdmin && isImportModalOpen && (
        <CsvImport
          onClose={() => setIsImportModalOpen(false)}
          onComplete={handleImportComplete}
        />
      )}
    </div>
  );
}