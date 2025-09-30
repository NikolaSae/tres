// app/(protected)/admin/aidash/components/DashboardSkeleton.tsx
'use client';

import { StatCard } from './StatCard';

export function DashboardSkeleton() {
  const placeholders = Array(4).fill(0);

  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {placeholders.map((_, i) => (
          <StatCard key={i} title="Loading..." value={0} icon="Database" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {placeholders.map((_, i) => (
          <StatCard key={i + 10} title="Loading..." value={0} icon="Database" />
        ))}
      </div>
    </div>
  );
}
