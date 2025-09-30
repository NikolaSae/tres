// app/(protected)/admin/aidash/components/DashboardContent.tsx
import { getDashboardData } from '../actions/dashboard';
import { StatCard } from './StatCard';

export default async function DashboardContent() {
  let data;
  try {
    data = await getDashboardData();
  } catch (err) {
    return <p className="text-red-600">Greška pri učitavanju dashboard-a</p>;
  }

  const { stats, health, toolsUsage } = data;

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Queries" value={stats.totalQueries} icon="Database" />
        <StatCard title="Active Users" value={health.users.active} icon="Users" color="success" />
        <StatCard title="Active Contracts" value={health.contracts.active} icon="AlertCircle" color="warning" />
        <StatCard title="Pending Complaints" value={health.complaints.pending} icon="MessageCircle" color="error" />
      </div>

      {/* Tools usage */}
      <div>
        <h2 className="text-xl font-bold mb-2">Tools Usage</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {toolsUsage.tools.map(tool => (
            <StatCard 
              key={tool.actualName} 
              title={tool.name} 
              value={tool.count} 
              subtitle={tool.lastUsed ? new Date(tool.lastUsed).toLocaleString() : 'Never'} 
              icon="Database" 
            />
          ))}
        </div>
      </div>
    </div>
  );
}
