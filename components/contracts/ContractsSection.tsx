"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ContractFilters } from "./ContractFilters";
import { ContractsList } from "./ContractList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Download, FileText } from "lucide-react";
import { Contract } from "@/lib/types/contract-types";

interface ContractsSectionProps {
  initialContracts: Contract[];
  initialTotalCount: number;
  initialTotalPages: number;
  initialCurrentPage: number;
  initialLimit: number;
}

export default function ContractsSection({
  initialContracts,
  initialTotalCount,
  initialTotalPages,
  initialCurrentPage,
  initialLimit
}: ContractsSectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [contracts, setContracts] = useState(initialContracts);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [currentPage, setCurrentPage] = useState(initialCurrentPage);
  const [itemsPerPage, setItemsPerPage] = useState(initialLimit);
  const [loading, setLoading] = useState(false);

  const stableSearchParams = useMemo(() => ({
    search: searchParams?.get("search") || "",
    status: searchParams?.get("status") || "",
    type: searchParams?.get("type") || "",
    partner: searchParams?.get("partner") || "",
  }), [searchParams]);

  const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

  const fetchContracts = useCallback(async (page: number, limit: number) => {
    // Cancel if component is unmounting or we've navigated away
    if (!window.location.pathname.startsWith('/contracts')) {
      return;
    }

    setLoading(true);

    const params = new URLSearchParams({
      ...stableSearchParams,
      page: page.toString(),
      limit: limit.toString(),
    });

    try {
      const res = await fetch(`/api/contracts?${params}`);
      
      // Double-check we're still on contracts page before updating state
      if (!window.location.pathname.startsWith('/contracts')) {
        return;
      }

      const data = await res.json();

      setContracts(data.contracts);
      setTotalCount(data.totalCount);
      setTotalPages(Math.ceil(data.totalCount / limit));
      setCurrentPage(page);
      setItemsPerPage(limit);
    } catch (error) {
      console.error("Error fetching contracts:", error);
    } finally {
      setLoading(false);
    }
  }, [stableSearchParams]);

  // Sync state with URL changes (when using browser back/forward)
  useEffect(() => {
    // Only run if we're still on the contracts page
    if (!window.location.pathname.startsWith('/contracts')) {
      return;
    }

    const page = parseInt(searchParams?.get("page") || "1");
    const limit = parseInt(searchParams?.get("limit") || initialLimit.toString());
    
    if (page !== currentPage || limit !== itemsPerPage) {
      fetchContracts(page, limit);
    }
  }, [searchParams, currentPage, itemsPerPage, initialLimit, fetchContracts]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || loading) return;
    
    const params = new URLSearchParams({
      ...stableSearchParams,
      page: page.toString(),
      limit: itemsPerPage.toString()
    });
    
    // Update URL and fetch data client-side
    window.history.pushState(null, '', `/contracts?${params}`);
    fetchContracts(page, itemsPerPage);
  };

  const handleItemsPerPageChange = (value: string) => {
    if (loading) return;
    
    const limit = parseInt(value);
    const params = new URLSearchParams({
      ...stableSearchParams,
      page: "1",
      limit: value
    });
    
    // Update URL and fetch data client-side
    window.history.pushState(null, '', `/contracts?${params}`);
    fetchContracts(1, limit);
  };

  const startItem = totalCount > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = Math.min(currentPage * itemsPerPage, totalCount);

  const pageNumbers = useMemo(() => {
    const maxVisiblePages = 5;
    const pages = [];
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, currentPage + 2);
      if (currentPage <= 3) end = maxVisiblePages;
      if (currentPage >= totalPages - 2) start = totalPages - maxVisiblePages + 1;
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Contracts ({totalCount})</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
            <Button size="sm" variant="outline">
              <FileText className="w-4 h-4 mr-2" /> Export PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ContractFilters
            contracts={contracts}
            onFilterChange={(filtered) => setContracts(filtered)}
          />

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <ContractsList contracts={contracts} />
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-2">
                <Button 
                  size="sm" 
                  onClick={() => handlePageChange(currentPage - 1)} 
                  disabled={currentPage <= 1 || loading}
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </Button>
                {pageNumbers.map((p) => (
                  <Button
                    key={p}
                    size="sm"
                    variant={p === currentPage ? "default" : "outline"}
                    onClick={() => handlePageChange(p)}
                    disabled={loading}
                  >
                    {p}
                  </Button>
                ))}
                <Button 
                  size="sm" 
                  onClick={() => handlePageChange(currentPage + 1)} 
                  disabled={currentPage >= totalPages || loading}
                >
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  Showing {startItem}-{endItem} of {totalCount}
                </span>
                <span>Show:</span>
                <Select 
                  value={itemsPerPage.toString()} 
                  onValueChange={handleItemsPerPageChange}
                  disabled={loading}
                >
                  <SelectTrigger className="w-[70px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEMS_PER_PAGE_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt.toString()}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span>per page</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}