//Path/components/contracts/ContractsSection.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { ContractFilters } from "./ContractFilters";
import { ContractsList } from "./ContractList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Download, FileText } from "lucide-react";
import { Contract } from "@/lib/types/contract-types";
import Link from "next/link";

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
  const searchParams = useSearchParams();

  // ✅ JEDNOSTAVNO - direktno koristi initial props bez state-a
  const contracts = initialContracts;
  const totalCount = initialTotalCount;
  const totalPages = initialTotalPages;
  const currentPage = initialCurrentPage;
  const itemsPerPage = initialLimit;

  const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

  const buildUrl = (page: number, limit: number) => {
    const params = new URLSearchParams();
    
    const search = searchParams?.get("search");
    const status = searchParams?.get("status");
    const type = searchParams?.get("type");
    const partner = searchParams?.get("partner");
    
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (type) params.set("type", type);
    if (partner) params.set("partner", partner);
    
    params.set("page", page.toString());
    params.set("limit", limit.toString());
    
    return `/contracts?${params.toString()}`;
  };

  const startItem = totalCount > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = Math.min(currentPage * itemsPerPage, totalCount);

  const pageNumbers = (() => {
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
  })();

  const serverTime = new Date().toISOString();

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
            onFilterChange={() => {}} // ✅ Filtriranje se dešava server-side
          />

          <ContractsList contracts={contracts} serverTime={serverTime} />

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-2">
                {/* ✅ KORISTI Link umesto Button + onClick */}
                {currentPage > 1 ? (
                  <Button size="sm" asChild>
                    <Link href={buildUrl(currentPage - 1, itemsPerPage)}>
                      <ChevronLeft className="w-4 h-4" /> Prev
                    </Link>
                  </Button>
                ) : (
                  <Button size="sm" disabled>
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </Button>
                )}

                {pageNumbers.map((p) => (
                  <Button
                    key={p}
                    size="sm"
                    variant={p === currentPage ? "default" : "outline"}
                    asChild={p !== currentPage}
                  >
                    {p === currentPage ? (
                      <span>{p}</span>
                    ) : (
                      <Link href={buildUrl(p, itemsPerPage)}>{p}</Link>
                    )}
                  </Button>
                ))}

                {currentPage < totalPages ? (
                  <Button size="sm" asChild>
                    <Link href={buildUrl(currentPage + 1, itemsPerPage)}>
                      Next <ChevronRight className="w-4 h-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button size="sm" disabled>
                    Next <ChevronRight className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  Showing {startItem}-{endItem} of {totalCount}
                </span>
                <span>Show:</span>
                <Select 
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    window.location.href = buildUrl(1, parseInt(value));
                  }}
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