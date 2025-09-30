// app/(protected)/admin/aidash/components/RecentlyUsedTools.tsx
'use client';
import { FC } from 'react';
import type { ToolUsage } from '@/lib/types/dashboard';

interface RecentlyUsedToolsProps {
  tools: ToolUsage[];
}

export const RecentlyUsedTools: FC<RecentlyUsedToolsProps> = ({ tools }) => {
  if (!tools.length) return <p className="text-gray-500 dark:text-gray-400">Nema podataka</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {tools.map(tool => (
        <div key={tool.actualName} className="p-4 border rounded-md hover:shadow-md bg-gray-50 dark:bg-gray-800">
          <p className="font-medium">{tool.name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Broj upotreba: {tool.count} {tool.lastUsed ? `, poslednji put: ${new Date(tool.lastUsed).toLocaleString()}` : ''}
          </p>
        </div>
      ))}
    </div>
  );
};
