// src/components/skeletons/ListSkeleton.tsx
"use client";

import React from 'react';
// Import your Skeleton component using a named import
import { Skeleton } from "@/components/ui/skeleton";

interface ListSkeletonProps {
  count?: number;
  itemHeight?: string; // You can still customize height if needed
}

const ListSkeleton: React.FC<ListSkeletonProps> = ({ count = 5, itemHeight = 'h-10' }) => {
  const skeletonItems = Array.from({ length: count });

  return (
    <div className="space-y-4">
      {skeletonItems.map((_, index) => (
        // Use your imported Skeleton component
        <Skeleton
          key={index}
          className={`w-full ${itemHeight}`} // Apply itemHeight to the Skeleton component
        />
      ))}
    </div>
  );
}

export default ListSkeleton;