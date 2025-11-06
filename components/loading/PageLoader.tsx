// Path: /components/loading/PageLoader.tsx
// Univerzalna loading komponenta za stranice

import { Skeleton } from "@/components/ui/skeleton";
import { LucideIcon } from "lucide-react";

interface PageLoaderProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  iconColor?: string;
}

export function PageLoader({ 
  title = "Loading...", 
  description = "Please wait while we load your data",
  icon: Icon,
  iconColor = "text-blue-600"
}: PageLoaderProps) {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className={`p-3 rounded-xl bg-gradient-to-br ${iconColor} shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              )}
              <Skeleton className="h-9 w-64" />
            </div>
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>

        {/* Content Skeleton */}
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-8 w-24 rounded-full" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="space-y-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Loading Spinner */}
        <div className="flex items-center justify-center py-8">
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin"></div>
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {title}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Path: /components/loading/TableLoader.tsx
// Loading za tabele

export function TableLoader({ rows = 10 }: { rows?: number }) {
  return (
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
        {[...Array(rows)].map((_, i) => (
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
      
      {/* Pagination */}
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
  );
}

// Path: /components/loading/FormLoader.tsx
// Loading za forme

export function FormLoader({ sections = 3 }: { sections?: number }) {
  return (
    <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm space-y-6">
      {[...Array(sections)].map((_, sectionIndex) => (
        <div key={sectionIndex} className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, fieldIndex) => (
              <div key={fieldIndex} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
      
      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <Skeleton className="h-10 w-24 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
    </div>
  );
}

// Path: /components/loading/StatsLoader.tsx
// Loading za statistike

export function StatsLoader({ cards = 4 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(cards)].map((_, i) => (
        <div
          key={i}
          className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-20 mb-2" />
          <Skeleton className="h-4 w-40" />
          
          {/* Mini chart */}
          <div className="mt-4 flex items-end gap-1 h-12">
            {[...Array(7)].map((_, j) => (
              <Skeleton 
                key={j} 
                className="flex-1"
                style={{ height: `${Math.random() * 100}%` }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Path: /components/loading/SpinnerLoader.tsx
// Centralni spinner loader

interface SpinnerLoaderProps {
  message?: string;
  submessage?: string;
  color?: "blue" | "green" | "red" | "orange" | "purple";
}

export function SpinnerLoader({ 
  message = "Loading...",
  submessage = "Please wait",
  color = "blue"
}: SpinnerLoaderProps) {
  const colorClasses = {
    blue: "border-t-blue-600",
    green: "border-t-green-600",
    red: "border-t-red-600",
    orange: "border-t-orange-600",
    purple: "border-t-purple-600"
  };

  return (
    <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
          <div className={`absolute inset-0 rounded-full border-4 border-transparent ${colorClasses[color]} animate-spin`}></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`w-3 h-3 rounded-full bg-gradient-to-br from-${color}-600 to-${color}-500 animate-pulse`}></div>
          </div>
        </div>
        <div className="text-center space-y-1">
          <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {message}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {submessage}
          </p>
        </div>
      </div>
    </div>
  );
}