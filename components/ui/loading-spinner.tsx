'use client';

import { NestedSpinner } from "./nested-spinner";

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[400px] bg-white dark:bg-gray-800 rounded-lg border">
      <NestedSpinner 
        variant="loader3"
        size={120}
        primaryColor="rgba(0, 0, 0, .4)"
        secondaryColor="rgba(59, 130, 246, .6)"
      />
    </div>
  );
}