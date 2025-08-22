// components/skeletons/ProviderDetailSkeleton.tsx
"use client";

import React from 'react';
import { Skeleton } from "@/components/ui/skeleton"; // Assuming you have Skeleton component

// A skeleton tailored for the provider details layout
const ProviderDetailSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 p-6 border rounded-md">
      {/* Header area placeholder */}
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-8 w-72" /> {/* Provider Name */}
        <Skeleton className="h-10 w-32" /> {/* Edit Button */}
      </div>

      {/* Details Cards Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Info Card Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" /> {/* Card Title */}
          <div className="space-y-2">
            <Skeleton className="h-5 w-64" /> {/* Contact Person */}
            <Skeleton className="h-5 w-56" /> {/* Email */}
            <Skeleton className="h-5 w-40" /> {/* Phone */}
            <Skeleton className="h-5 w-72" /> {/* Address */}
          </div>
        </div>

        {/* System Info Card Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" /> {/* Card Title */}
          <div className="space-y-2">
            <Skeleton className="h-5 w-56" /> {/* Created At */}
            <Skeleton className="h-5 w-56" /> {/* Updated At */}
             {/* Add placeholders for counts */}
             <Skeleton className="h-5 w-40" />
             <Skeleton className="h-5 w-40" />
             <Skeleton className="h-5 w-40" />
             <Skeleton className="h-5 w-40" />
          </div>
        </div>
      </div>

      {/* Contracts/Related Items Section Placeholder */}
      <div className="mt-8 space-y-4">
        <Skeleton className="h-6 w-56" /> {/* Section Title */}
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" /> {/* Table Row 1 */}
          <Skeleton className="h-12 w-full" /> {/* Table Row 2 */}
          <Skeleton className="h-12 w-full" /> {/* Table Row 3 */}
        </div>
      </div>
    </div>
  );
};

export default ProviderDetailSkeleton;
