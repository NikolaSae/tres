// src/components/skeletons/DetailSkeleton.tsx
"use client";

import React from 'react';
// Import your Skeleton component using a named import
import { Skeleton } from "@/components/ui/skeleton";

interface DetailSkeletonProps {
  // You can add props here if you want to customize the layout or number of placeholders
}

const DetailSkeleton: React.FC<DetailSkeletonProps> = () => {
  return (
    <div className="space-y-6 p-6 border rounded-md">
      {/* Placeholder for title/header area */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-64" />
        <div className="flex gap-2">
           <Skeleton className="h-10 w-24" />
           <Skeleton className="h-10 w-20" />
        </div>
      </div>

      {/* Placeholder sections for details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* Contact Info Section Placeholder */}
         <div className="space-y-4">
             <Skeleton className="h-6 w-48" /> {/* Section Title */}
             <div className="space-y-2">
                <Skeleton className="h-5 w-56" /> {/* Contact Person */}
                <Skeleton className="h-5 w-48" /> {/* Email */}
                <Skeleton className="h-5 w-40" /> {/* Phone */}
                <Skeleton className="h-5 w-64" /> {/* Address */}
             </div>
         </div>

         {/* System Info Section Placeholder */}
         <div className="space-y-4">
             <Skeleton className="h-6 w-48" /> {/* Section Title */}
              <div className="space-y-2">
                <Skeleton className="h-5 w-56" /> {/* Created At */}
                <Skeleton className="h-5 w-56" /> {/* Updated At */}
             </div>
         </div>
      </div>

       {/* Placeholder for Contracts Section */}
       <div className="mt-8 space-y-4">
           <Skeleton className="h-6 w-48" /> {/* Section Title */}
            <div className="space-y-2">
                <Skeleton className="h-12 w-full" /> {/* Contract Item 1 */}
                <Skeleton className="h-12 w-full" /> {/* Contract Item 2 */}
                <Skeleton className="h-12 w-full" /> {/* Contract Item 3 */}
            </div>
       </div>

    </div>
  );
}

export default DetailSkeleton;
