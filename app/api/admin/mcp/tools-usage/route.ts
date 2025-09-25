// app/api/admin/mcp/tools-usage/route.ts - Novi endpoint za tools tab
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'MANAGER'].includes(session.user.role || '')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Dohvati sve MCP tool usage iz activity logs
    const mcpLogs = await db.activityLog.findMany({
      where: { action: { startsWith: 'MCP_QUERY_' } },
      select: { action: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });

    // Grupiši po tool-u
    const toolUsage = new Map<string, number>();
    mcpLogs.forEach(log => {
      const toolMatch = log.action.match(/^MCP_QUERY_(.+)$/);
      if (toolMatch) {
        const toolName = toolMatch[1].toLowerCase();
        toolUsage.set(toolName, (toolUsage.get(toolName) || 0) + 1);
      }
    });

    // Mapiranje na display nazive
    const TOOL_DISPLAY_MAPPING: Record<string, string> = {
      'get_contracts': 'get_active_contracts',
      'get_providers': 'search_providers',
      'get_complaints': 'pending_complaints',
      'pending_complaints': 'pending_complaints',
      'get_user_stats': 'user_statistics',
      'search_entities': 'search_humanitarian_orgs',
      'get_system_health': 'system_statistics'
    };

    // Kreiraj listu svih dostupnih tools-a
    const allTools = [
      'get_contracts',
      'get_providers', 
      'get_complaints',
      'search_entities',
      'get_system_health',
      'get_user_stats'
    ];

    const toolsWithUsage = allTools.map(tool => ({
      name: TOOL_DISPLAY_MAPPING[tool] || tool,
      actualName: tool,
      count: toolUsage.get(tool) || 0,
      lastUsed: mcpLogs.find(log => log.action === `MCP_QUERY_${tool.toUpperCase()}`)?.createdAt || null
    }));

    return Response.json({
      tools: toolsWithUsage.sort((a, b) => b.count - a.count),
      totalUsage: Array.from(toolUsage.values()).reduce((sum, count) => sum + count, 0),
      period: 'all time',
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching tools usage:', error);
    return Response.json({
      error: 'Internal server error',
      tools: []
    }, { status: 500 });
  }
}