// app/(protected)/contracts/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, FileSpreadsheet, Clock } from "lucide-react";

export default function ContractsLoading() {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header Section Skeleton */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="space-y-3 flex-1">
            <Skeleton className="h-10 w-96" />
            <Skeleton className="h-5 w-full max-w-2xl" />
            <Skeleton className="h-5 w-3/4 max-w-xl" />
            
            {/* Status Legend Skeleton */}
            <div className="flex flex-wrap items-center gap-4 pt-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-24 rounded-full" />
              ))}
            </div>
            
            {/* Debug Info Skeleton */}
            <Skeleton className="h-16 w-full mt-3 rounded-lg" />
          </div>
          
          {/* Action Buttons Skeleton */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:min-w-[400px]">
            <Skeleton className="h-12 w-full sm:w-32 rounded-xl" />
            <Skeleton className="h-12 w-full sm:w-32 rounded-xl" />
            <Skeleton className="h-12 w-full sm:w-40 rounded-xl" />
          </div>
        </div>

        {/* Filters Section Skeleton */}
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>

        {/* Contracts Table Skeleton */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="bg-gray-50 dark:bg-gray-900/50 p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-12 gap-4">
              <Skeleton className="h-5 w-full col-span-3" />
              <Skeleton className="h-5 w-full col-span-2" />
              <Skeleton className="h-5 w-full col-span-2" />
              <Skeleton className="h-5 w-full col-span-2" />
              <Skeleton className="h-5 w-full col-span-2" />
              <Skeleton className="h-5 w-full col-span-1" />
            </div>
          </div>
          
          {/* Table Rows */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-3 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <div className="col-span-2">
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                  <div className="col-span-2">
                    <Skeleton className="h-5 w-full" />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                  <div className="col-span-2">
                    <Skeleton className="h-5 w-full" />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination Skeleton */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-40" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
          </div>
        </div>

        {/* Help Section Skeleton */}
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    </div>
  );
}