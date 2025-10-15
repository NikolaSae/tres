'use client';

import { NestedSpinner } from './nested-spinner';

export const FullScreenLoader = () => (
  <div className="w-full h-[300px] md:h-[400px] flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
    <NestedSpinner
      variant="loader1"
      size={80}
      primaryColor="rgba(0,0,0,0.6)"
      secondaryColor="rgba(59,130,246,0.6)"
    />
  </div>
);
