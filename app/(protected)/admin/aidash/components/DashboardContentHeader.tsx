// app/(protected)/admin/aidash/components/DashboardContentHeader.tsx

'use client';
import { FC } from 'react';

interface DashboardContentHeaderProps {
  activeTab: 'stats' | 'tools' | 'chat';
  setActiveTab: (tab: 'stats' | 'tools' | 'chat') => void;
}

export const DashboardContentHeader: FC<DashboardContentHeaderProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { key: 'stats', label: 'Statistika' },
    { key: 'tools', label: 'Recently Used Tools' },
    { key: 'chat', label: 'Chat' },
  ] as const;

  return (
    <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700 pb-2">
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key)}
          className={`px-3 py-1 font-medium rounded-md ${
            activeTab === tab.key ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};
