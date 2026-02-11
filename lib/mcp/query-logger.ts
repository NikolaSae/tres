// lib/mcp/query-logger.ts

import { db } from '@/lib/db';

/**
 * Log MCP tool query za tracking i analytics
 */
export async function logQuery(
  userId: string,
  toolName: string,
  params: any
): Promise<void> {
  try {
    await db.queryLog.create({
      data: {
        userId,
        toolName,
        params: params || {},
        createdAt: new Date()
      }
    });
  } catch (error) {
    // Silent fail - ne želimo daломимо tool execution zbog logging greške
    console.warn('Failed to log query:', error);
  }
}

/**
 * Dobij recent queries za korisnika
 */
export async function getRecentQueries(
  userId: string,
  limit: number = 10
): Promise<string[]> {
  try {
    const queries = await db.queryLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { toolName: true }
    });

    // Return unique tool names
    return [...new Set(queries.map(q => q.toolName))];
  } catch (error) {
    console.warn('Failed to get recent queries:', error);
    return [];
  }
}

/**
 * Dobij statistiku korišćenja alata
 */
export async function getToolUsageStats(
  userId: string,
  days: number = 30
): Promise<Record<string, number>> {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const queries = await db.queryLog.findMany({
      where: {
        userId,
        createdAt: { gte: since }
      },
      select: { toolName: true }
    });

    // Count by tool name
    const stats: Record<string, number> = {};
    queries.forEach(q => {
      stats[q.toolName] = (stats[q.toolName] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.warn('Failed to get tool usage stats:', error);
    return {};
  }
}

/**
 * Očisti stare query logs (retention policy)
 */
export async function cleanOldQueryLogs(daysToKeep: number = 90): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await db.queryLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate }
      }
    });

    console.log(`Cleaned ${result.count} old query logs`);
    return result.count;
  } catch (error) {
    console.error('Failed to clean old query logs:', error);
    return 0;
  }
}

export async function getQueryHistory(
  userId?: string,
  options: { limit?: number; toolName?: string; fromDate?: Date; toDate?: Date } = {}
) {
  const where: any = {};
  if (userId) where.userId = userId;
  if (options.toolName) where.toolName = options.toolName;
  if (options.fromDate || options.toDate) {
    where.createdAt = {};
    if (options.fromDate) where.createdAt.gte = options.fromDate;
    if (options.toDate) where.createdAt.lte = options.toDate;
  }

  return db.queryLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: options.limit ?? 50,
  });
}

export const queryLogger = {
  logQuery,
  getRecentQueries,
  getToolUsageStats,
  cleanOldQueryLogs,
  getQueryHistory,
};