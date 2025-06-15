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

  // --- Helper funkcija za bezbedno kreiranje Date objekata ---
  const safeDate = useCallback((dateString: string | null | undefined): Date | undefined => {
    if (!dateString) return undefined;
    const date = new Date(dateString);
    // Proverava da li je datum validan
    return isNaN(date.getTime()) ? undefined : date;
  }, []); // Callback se kreira samo jednom

  // --- Get query parameters from URL ---
  const status = searchParams.get("status") as ComplaintStatus | null;
  const serviceId = searchParams.get("serviceId");
  const providerId = searchParams.get("providerId");
  const productId = searchParams.get("productId");
  const startDateString = searchParams.get("startDate"); // Get date as STRING
  const endDateString = searchParams.get("endDate");   // Get date as STRING
  const search = searchParams.get("search");

  // --- Pagination ---
  const pageParam = searchParams.get("page");
  const currentPage = pageParam ? parseInt(pageParam, 10) : 1; // Current page from URL
  const pageSize = 10; // Define your desired page size

  // --- Memoize query parameters for the hook ---
  const queryParams = useMemo(() => {
    return {
      status: status || undefined,
      serviceId: serviceId || undefined,
      providerId: providerId || undefined,
      productId: productId || undefined,
      // Koristimo safeDate helper
      startDate: safeDate(startDateString), 
      endDate: safeDate(endDateString),   
      search: search || undefined,
      limit: pageSize, 
      page: currentPage, 
    };
  }, [
    status,
    serviceId,
    providerId,
    productId,
    startDateString, 
    endDateString,   
    search,
    currentPage, 
    pageSize,
    safeDate // Zavisimo od safeDate callbacka
  ]);


  // --- Fetch data using the hook with memoized params ---
  const { complaints, isLoading, error, totalCount, totalPages } = useComplaints(queryParams);


  // --- Notification Logic (Keep existing) ---
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  useEffect(() => {
    const message = searchParams.get("message");
    const type = searchParams.get("type") as "success" | "error" | "info" | null;

    if (message && type) {
      setNotification({ message, type });

      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [searchParams]);


  // --- Pagination Change Handler ---
  const handlePageChange = useCallback((page: number) => {
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.set("page", page.toString());
    router.push(`/complaints?${currentParams.toString()}`);
  }, [router, searchParams]);


  // --- Filter Change Handler ---
  const handleFilterChange = useCallback((filters: ComplaintFiltersState) => {
    const newParams = new URLSearchParams();

    if (filters.statuses && filters.statuses.length > 0) {
      filters.statuses.forEach(status => newParams.append("status", status));
    }
    if (filters.serviceId) newParams.append("serviceId", filters.serviceId);
    if (filters.providerId) newParams.append("providerId", filters.providerId);
    // Ako ComplaintFiltersState uključuje i ove filtere, dodajte ih ovde
    // if (filters.productId) newParams.append("productId", filters.productId);

    // KLJUČNA IZMENA: Proveravamo validnost Date objekata pre konverzije u string za URL
    if (filters.dateRange?.from && !isNaN(filters.dateRange.from.getTime())) {
      newParams.append("startDate", filters.dateRange.from.toISOString());
    } 
    if (filters.dateRange?.to && !isNaN(filters.dateRange.to.getTime())) {
      newParams.append("endDate", filters.dateRange.to.toISOString());
    }
    // if (filters.search) newParams.append("search", filters.search);

    newParams.set("page", "1"); // Reset page to 1 when filters change

    router.push(`/complaints?${newParams.toString()}`);
  }, [router]);


  // --- Helper to check if any non-pagination filter is active ---
  const hasActiveFilters = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page"); // Ignorišemo parametar stranice
    // params.delete("limit");
    return params.toString().length > 0;
  }, [searchParams]);

  // Determine what content to show based on conditions
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          Error loading complaints: {error.message}
        </div>
      );
    }
    
    if (complaints.length === 0 && currentPage === 1 && !hasActiveFilters) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No complaints found.
        </div>
      );
    }
    
    if (complaints.length === 0 && (currentPage > 1 || hasActiveFilters)) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No complaints found matching the criteria.
        </div>
      );
    }
    
    return (
      <ComplaintList
        complaints={complaints}
        totalComplaints={totalCount}
        page={currentPage}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        userRole="ADMIN" // <-- Replace with dynamic user role
      />
    );
  };

  return (
    <div className="container mx-auto py-8 space-y-6 top-0">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Complaints Management</h1>
        <Button
          onClick={() => router.push("/complaints/new")}
          className="bg-primary hover:bg-primary/90"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          New Complaint
        </Button>
      </div>

      {notification && (
        <NotificationBanner
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Pass current filters from URL and the change handler */}
      <ComplaintFilters
        filters={{
          statuses: status ? [status] : [],
          serviceId: serviceId || undefined,
          providerId: providerId || undefined,
          dateRange: {
            // KLJUČNA IZMENA: Koristimo safeDate helper pre prosleđivanja propa
            from: safeDate(startDateString),
            to: safeDate(endDateString),
          }
        }}
        onFiltersChange={handleFilterChange}
      />

      {renderContent()}
    </div>
  );
}