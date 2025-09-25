// Path: app/(protected)/operators/page.tsx
import { getOperators } from "@/actions/operators";
import { OperatorList } from "@/components/operators/OperatorList";
import { OperatorFilters } from "@/components/operators/OperatorFilters";
import { Suspense } from "react";
import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Operators | Management Platform",
  description: "Manage operators in the system",
};

export default async function OperatorsPage({
  searchParams,
}: {
  searchParams: {
    search?: string;
    active?: "all" | "active" | "inactive";
    sortBy?: "name" | "code" | "createdAt";
    sortOrder?: "asc" | "desc";
    page?: string;
    pageSize?: string;
  };
}) {
  const searchParamsData = await searchParams;
  
  const initialFilters = {
    search: searchParamsData.search ?? "",
    active: (searchParamsData.active ?? "all") as "all" | "active" | "inactive",
    sortBy: (searchParamsData.sortBy ?? "name") as "name" | "code" | "createdAt",
    sortOrder: (searchParamsData.sortOrder ?? "asc") as "asc" | "desc",
    page: searchParamsData.page ? Number(searchParamsData.page) : 1,
    pageSize: searchParamsData.pageSize ? Number(searchParamsData.pageSize) : 10,
  };

  const safeFilters = {
    ...initialFilters,
    page: isNaN(initialFilters.page) ? 1 : initialFilters.page,
    pageSize: isNaN(initialFilters.pageSize) ? 10 : initialFilters.pageSize,
  };

  return (
    <div className="min-h-screen bg-card">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6 rounded-lg shadow-sm border">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">
              Operators Management
            </h1>
            <p className="max-w-2xl">
              Manage all operators in the system. Use filters to quickly find specific operators by status, name, or code.
            </p>
          </div>
          
          <Button asChild>
            <Link href="/operators/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Operator
            </Link>
          </Button>
        </div>

        {/* Main content section */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Operator List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <OperatorFilters initialFilters={searchParamsData} />
              
              <Separator className="my-6" />
              
              <Suspense fallback={<OperatorListSkeleton />}>
                <OperatorsList filters={safeFilters} />
              </Suspense>
            </div>
          </CardContent>
        </Card>

        {/* Footer info */}
        <div className="bg-card p-4 rounded-lg border text-center">
          <p className="text-sm text-gray-500">
            Need help managing operators?{" "}
            <Link href="/help/operators" className="text-blue-600 hover:text-blue-800 underline">
              View documentation
            </Link>{" "}
            or{" "}
            <Link href="/support" className="text-blue-600 hover:text-blue-800 underline">
              contact support
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

async function OperatorsList({ filters }: {
    filters: {
      search: string;
      active: "all" | "active" | "inactive";
      sortBy: "name" | "code" | "createdAt";
      sortOrder: "asc" | "desc";
      page: number;
      pageSize: number;
    };
}) {
  const result = await getOperators(filters);
  return <OperatorList data={result.operators} totalCount={result.totalCount} pageCount={result.pageCount} currentPage={result.currentPage} />;
}

function OperatorListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <div className="bg-muted/50 p-4">
          <div className="grid grid-cols-6 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-6" />
            ))}
          </div>
        </div>
        <div className="divide-y">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="p-4">
              <div className="grid grid-cols-6 gap-4">
                {Array(6).fill(0).map((_, j) => (
                  <Skeleton key={j} className="h-6" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}