// app/api/admin/mcp/stats/route.ts - POPRAVLJEN
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'MANAGER'].includes(session.user.role || '')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // ISPRAVKA: Čitamo iz activityLog tabele umjesto queryLog
    const totalQueries = await db.activityLog.count({
      where: {
        action: { startsWith: 'MCP_QUERY_' }
      }
    });
    
    if (totalQueries === 0) {
      return Response.json({
        totalQueries: 0,
        topTools: [],
        recentActivity: [],
        message: 'Nema zabeleženih MCP upita.'
      });
    }

    // Dohvati top tools iz poslednih 30 dana
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Grupiraj po action (koji sadrži tool naziv)
    const activityLogs = await db.activityLog.findMany({
      where: {
        action: { startsWith: 'MCP_QUERY_' },
        createdAt: { gte: thirtyDaysAgo }
      },
      include: {
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Ekstraktuj tool nazive iz action field-a i grupiši
    const toolCounts = new Map<string, number>();
    const userActivityMap = new Map<string, any>();

    activityLogs.forEach(log => {
      // Izvuci tool naziv iz action (npr. "MCP_QUERY_GET_CONTRACTS" -> "get_contracts")
      const toolMatch = log.action.match(/^MCP_QUERY_(.+)$/);
      if (!toolMatch) return;
      
      let toolName = toolMatch[1].toLowerCase();
      
      // Mapiranje interni -> display nazivi
      const TOOL_DISPLAY_MAPPING: Record<string, string> = {
        'get_contracts': 'get_active_contracts',
        'get_providers': 'search_providers',
        'get_complaints': 'pending_complaints',
        'pending_complaints': 'pending_complaints', // već je display naziv
        'get_user_stats': 'user_statistics',
        'search_entities': 'search_humanitarian_orgs',
        'get_system_health': 'system_statistics',
        'get_activity_overview': 'activity_overview',
        'get_financial_summary': 'financial_summary',
        'manage_user': 'user_management'
      };

      const displayName = TOOL_DISPLAY_MAPPING[toolName] || toolName;
      
      // Count po tool-u
      toolCounts.set(displayName, (toolCounts.get(displayName) || 0) + 1);
      
      // Recent activity po korisniku
      const userKey = `${log.userId}-${displayName}`;
      if (!userActivityMap.has(userKey)) {
        userActivityMap.set(userKey, {
          userId: log.userId,
          userName: log.user?.name || log.user?.email || 'Unknown',
          toolName: displayName,
          actualToolName: toolName,
          timestamp: log.createdAt,
          count: 0
        });
      }
      userActivityMap.get(userKey).count++;
    });

    // Top tools - sortirani po broju korišćenja
    const topTools = Array.from(toolCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Recent activity - poslednje aktivnosti
    const recentActivity = Array.from(userActivityMap.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    return Response.json({
      totalQueries,
      topTools,
      recentActivity,
      period: '30 days',
      lastUpdated: new Date().toISOString(),
      debug: {
        totalActivityLogs: activityLogs.length,
        uniqueTools: Array.from(toolCounts.keys()),
        rawSample: activityLogs.slice(0, 3).map(log => ({
          action: log.action,
          createdAt: log.createdAt,
          userId: log.userId
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching MCP stats:', error);
    return Response.json({
      error: 'Internal server error',
      totalQueries: 0,
      topTools: [],
      recentActivity: [],
      debug: {
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}