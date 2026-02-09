// app/(protected)/admin/aidash/components/DashboardShell.tsx
'use client'; // <-- OBAVEZNO mora biti na vrhu fajla

import { useState, useTransition } from 'react';
import { StatCard } from './StatCard';
import { DashboardContentHeader } from './DashboardContentHeader';
import { ChatInterface } from './ChatInterface';
import { RecentlyUsedTools } from './RecentlyUsedTools';
import { DashboardData } from '@/lib/types/dashboard';
import { Button } from '@/components/ui/button';

interface DashboardShellProps {
  initialData: DashboardData;
}

export function DashboardShell({ initialData }: DashboardShellProps) {
  const [data, setData] = useState(initialData);
  const [activeTab, setActiveTab] = useState<'stats' | 'tools' | 'chat'>('stats');
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      <DashboardContentHeader activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Aktivni korisnici"
            value={data.health.users?.active || 0}
            subtitle={`od ${data.health.users?.total || 0} ukupno`}
            icon="Users"
            color="success"
          />
          <StatCard
            title="Aktivni ugovori"
            value={data.health.contracts?.active || 0}
            subtitle={`od ${data.health.contracts?.total || 0} ukupno`}
            icon="Database"
            color="success"
          />
          <StatCard
            title="Na čekanju"
            value={data.health.complaints?.pending || 0}
            icon="AlertCircle"
            color="warning"
          />

          <StatCard
            title="Humanitarni"
            value={data.health.humanitarians?.length || 0}
            icon="MessageCircle"
            color="default"
          />
        </div>
      )}

      {activeTab === 'tools' && <RecentlyUsedTools tools={data.toolsUsage?.tools || []} />}
      {activeTab === 'chat' && <ChatInterface />}
    </div>
  );
}
