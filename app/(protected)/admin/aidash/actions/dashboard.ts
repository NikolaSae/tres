// app/(protected)/admin/aidash/actions/dashboard.tsx

import { db } from '@/lib/db';
import { auth } from '@/auth';
import type { DashboardData, ChatMessage } from '@/lib/types/dashboard';

// Server action za dashboard
export async function getDashboardData(): Promise<DashboardData> {
  const session = await auth();
  if (!session?.user || !['ADMIN', 'MANAGER'].includes(session.user.role || '')) {
    throw new Error('Unauthorized');
  }

  // System health
  const [totalUsers, activeUsers, totalContracts, activeContracts, pendingComplaints, humanitarians, toolLogs] =
    await Promise.all([
      db.user.count(),
      db.user.count({ where: { isActive: true } }),
      db.contract.count(),
      db.contract.count({ where: { status: 'ACTIVE' } }),
      db.complaint.count({ where: { status: { in: ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'PENDING'] } } }),
      db.humanitarianOrg.findMany({
        where: { shortNumber: { not: null } },
        select: { name: true, shortNumber: true, contactName: true, email: true, phone: true, address: true, mission: true },
        take: 20,
      }),
      db.activityLog.findMany({
        where: { action: { startsWith: 'MCP_QUERY_' } },
        orderBy: { createdAt: 'desc' },
        select: { action: true, createdAt: true },
      }),
    ]);

  // Mapiranje tool usage
  const toolMap = new Map<string, number>();
  toolLogs.forEach(log => {
    const m = log.action.match(/^MCP_QUERY_(.+)$/);
    if (m) {
      const toolName = m[1].toLowerCase();
      toolMap.set(toolName, (toolMap.get(toolName) || 0) + 1);
    }
  });

  const TOOL_DISPLAY_MAPPING: Record<string, string> = {
    'get_contracts': 'get_active_contracts',
    'get_providers': 'search_providers',
    'get_complaints': 'pending_complaints',
    'pending_complaints': 'pending_complaints',
    'get_user_stats': 'user_statistics',
    'search_entities': 'search_humanitarian_orgs',
    'get_system_health': 'system_statistics'
  };

  const allTools = ['get_contracts','get_providers','get_complaints','search_entities','get_system_health','get_user_stats'];

  const toolsWithUsage = allTools.map(tool => ({
    name: TOOL_DISPLAY_MAPPING[tool] || tool,
    actualName: tool,
    count: toolMap.get(tool) || 0,
    lastUsed: toolLogs.find(l => l.action === `MCP_QUERY_${tool.toUpperCase()}`)?.createdAt || null
  }));

  return {
    stats: {
      totalQueries: toolLogs.length,
      topTools: toolsWithUsage.sort((a,b)=>b.count - a.count).slice(0,5),
      recentActivity: [], // možeš dodati detalje po korisniku ako treba
      period: 'all time',
      lastUpdated: new Date().toISOString()
    },
    health: {
      users: { total: totalUsers, active: activeUsers },
      contracts: { total: totalContracts, active: activeContracts },
      complaints: { pending: pendingComplaints },
      humanitarians,
      systemStatus: 'healthy',
      lastChecked: new Date().toISOString()
    },
    toolsUsage: {
      tools: toolsWithUsage,
      totalUsage: Array.from(toolMap.values()).reduce((sum,c)=>sum+c,0),
      period: 'all time',
      lastUpdated: new Date().toISOString()
    }
  };
}

// Server action za chat
export async function sendChatMessage(message: ChatMessage) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  return { role: 'assistant', content: `Eho: ${message.content}` };
}
