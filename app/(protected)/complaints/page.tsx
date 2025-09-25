// app/(protected)/complaints/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ComplaintList } from "@/components/complaints/ComplaintList";
import { ComplaintFilters, ComplaintFiltersState } from "@/components/complaints/ComplaintFilters";
import { NotificationBanner } from "@/components/complaints/NotificationBanner";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle } from "lucide-react";
import { useComplaints } from "@/hooks/use-complaints";
import { ComplaintStatus } from "@/lib/types/enums";

export default function ComplaintsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const safeDate = useCallback((dateString: string | null | undefined): Date | undefined => {
    if (!dateString) return undefined;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? undefined : date;
  }, []);

  const status = searchParams.get("status") as ComplaintStatus | null;
  const serviceId = searchParams.get("serviceId");
  const providerId = searchParams.get("providerId");
  const productId = searchParams.get("productId");
  const startDateString = searchParams.get("startDate");
  const endDateString = searchParams.get("endDate");
  const search = searchParams.get("search");

  const pageParam = searchParams.get("page");
  const currentPage = pageParam ? parseInt(pageParam, 10) : 1;
  const pageSize = 10;

  const queryParams = useMemo(() => ({
    status: status || undefined,
    serviceId: serviceId || undefined,
    providerId: providerId || undefined,
    productId: productId || undefined,
    startDate: safeDate(startDateString),
    endDate: safeDate(endDateString),
    search: search || undefined,
    limit: pageSize,
    page: currentPage,
  }), [status, serviceId, providerId, productId, startDateString, endDateString, search, currentPage, pageSize, safeDate]);

  const { complaints, isLoading, error, totalCount } = useComplaints(queryParams);

  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" | "info"; } | null>(null);

  useEffect(() => {
    const message = searchParams.get("message");
    const type = searchParams.get("type") as "success" | "error" | "info" | null;
    if (message && type) {
      setNotification({ message, type });
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const handlePageChange = useCallback((page: number) => {
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.set("page", page.toString());
    router.push(`/complaints?${currentParams.toString()}`);
  }, [router, searchParams]);

  const handleFilterChange = useCallback((filters: ComplaintFiltersState) => {
    const newParams = new URLSearchParams();
    if (filters.statuses?.length) filters.statuses.forEach(status => newParams.append("status", status));
    if (filters.serviceId) newParams.append("serviceId", filters.serviceId);
    if (filters.providerId) newParams.append("providerId", filters.providerId);
    if (filters.dateRange?.from && !isNaN(filters.dateRange.from.getTime())) newParams.append("startDate", filters.dateRange.from.toISOString());
    if (filters.dateRange?.to && !isNaN(filters.dateRange.to.getTime())) newParams.append("endDate", filters.dateRange.to.toISOString());
    newParams.set("page", "1");
    router.push(`/complaints?${newParams.toString()}`);
  }, [router]);

  const hasActiveFilters = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    return params.toString().length > 0;
  }, [searchParams]);

  const renderContent = () => {
    if (isLoading) return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
    if (error) return (
      <div className="bg-destructive/10 text-destructive p-4 rounded-md">
        Error loading complaints: {error.message}
      </div>
    );
    if (complaints.length === 0) return (
      <div className="text-center py-8 text-muted-foreground">
        {currentPage === 1 && !hasActiveFilters ? "No complaints found." : "No complaints found matching the criteria."}
      </div>
    );
    return (
      <ComplaintList
        complaints={complaints}
        totalComplaints={totalCount}
        page={currentPage}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        userRole="ADMIN"
      />
    );
  };

  return (
    <div className="container mx-auto py-8 space-y-6 top-0">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Complaints Management</h1>
        <Button
          onClick={() => router.push("/complaints/new")}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          New Complaint
        </Button>
      </div>

      {/* Notification */}
      {notification && (
        <NotificationBanner
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
          className="card bg-card text-card-foreground shadow-container"
        />
      )}

      {/* Filters */}
      <div className="card bg-card text-card-foreground p-4 rounded-lg shadow-container">
        <ComplaintFilters
          filters={{
            statuses: status ? [status] : [],
            serviceId: serviceId || undefined,
            providerId: providerId || undefined,
            dateRange: { from: safeDate(startDateString), to: safeDate(endDateString) }
          }}
          onFiltersChange={handleFilterChange}
        />
      </div>

      {/* Content */}
      <div className="space-y-4">
        {renderContent()}
      </div>
    </div>
  );
}
