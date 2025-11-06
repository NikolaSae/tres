// Path: /app/(protected)/contracts/import/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { FileSpreadsheet } from "lucide-react";

export default function ImportContractsLoading() {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          <div className="space-y-2">
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>

        {/* Upload Section Skeleton */}
        <div className="p-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          <div className="space-y-6">
            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 bg-gray-50 dark:bg-gray-900/30">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <FileSpreadsheet className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <div className="text-center space-y-2">
                  <Skeleton className="h-5 w-64 mx-auto" />
                  <Skeleton className="h-4 w-96 mx-auto" />
                </div>
                <Skeleton className="h-10 w-40 rounded-lg" />
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-4">
              <Skeleton className="h-6 w-48" />
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-6 w-6 rounded-full flex-shrink-0" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            </div>

            {/* Template Download */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-10 w-40 rounded-lg" />
              </div>
            </div>
          </div>
        </div>

        {/* Loading Indicator */}
        <div className="flex items-center justify-center py-8">
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-gray-600 animate-spin"></div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 animate-pulse">
              Loading import tool...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}