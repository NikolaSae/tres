// lib/mcp/query-logger.ts
import { db } from '@/lib/db';

interface QueryLog {
  id: string;
  userId: string;
  toolName: string;
  parameters: any;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

class QueryLogger {
  async logQuery(
    userId: string,
    toolName: string,
    parameters: any,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ) {
    try {
      await db.activityLog.create({
        data: {
          action: `MCP_QUERY_${toolName.toUpperCase()}`,
          entityType: 'mcp_query',
          details: JSON.stringify({
            toolName,
            parameters,
            metadata
          }),
          severity: 'INFO',
          userId
        }
      });
    } catch (error) {
      console.error('Failed to log MCP query:', error);
    }
  }

  async getQueryHistory(
    userId: string,
    options?: {
      limit?: number;
      toolName?: string;
      fromDate?: Date;
      toDate?: Date;
    }
  ) {
    const where: any = {
      userId,
      action: { startsWith: 'MCP_QUERY_' }
    };

    if (options?.toolName) {
      where.action = `MCP_QUERY_${options.toolName.toUpperCase()}`;
    }

    if (options?.fromDate || options?.toDate) {
      where.createdAt = {};
      if (options.fromDate) where.createdAt.gte = options.fromDate;
      if (options.toDate) where.createdAt.lte = options.toDate;
    }

    return await db.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 100,
      include: {
        user: {
          select: { name: true, email: true, role: true }
        }
      }
    });
  }

  async clearOldLogs(userId: string, olderThan: Date): Promise<number> {
    try {
      const result = await db.queryLog.deleteMany({
        where: {
          userId,
          createdAt: { lt: olderThan }
        }
      });
      
      console.log(`Cleared ${result.count} old log entries for user ${userId}`);
      return result.count;
    } catch (error) {
      console.error('Error clearing old logs:', error);
      throw error;
    }
  }
  
  async getUsageStats(timeframe: 'day' | 'week' | 'month' = 'week') {
    const now = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    const stats = await db.activityLog.groupBy({
      by: ['userId', 'action'],
      where: {
        action: { startsWith: 'MCP_QUERY_' },
        createdAt: { gte: startDate }
      },
      _count: { _all: true }
    });

    const userStats = await prisma.activityLog.groupBy({
      by: ['userId'],
      where: {
        action: { startsWith: 'MCP_QUERY_' },
        createdAt: { gte: startDate }
      },
      _count: { _all: true }
    });

    return {
      totalQueries: stats.reduce((sum, stat) => sum + stat._count._all, 0),
      queryBreakdown: stats.map(stat => ({
        userId: stat.userId,
        tool: stat.action.replace('MCP_QUERY_', '').toLowerCase(),
        count: stat._count._all
      })),
      userBreakdown: userStats.map(stat => ({
        userId: stat.userId,
        totalQueries: stat._count._all
      }))
    };
  }
}

export const queryLogger = new QueryLogger();
export const logQuery = queryLogger.logQuery.bind(queryLogger);