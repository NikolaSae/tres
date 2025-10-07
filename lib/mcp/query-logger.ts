// lib/mcp/query-logger.ts - Query logging za MCP operacije

import { db } from '@/lib/db';

/**
 * Logger za MCP tool pozive - koristi se za:
 * - Audit trail
 * - Analytics o korišćenju alata
 * - Debugging
 * - Performance tracking
 */

interface LogEntry {
  userId: string;
  toolName: string;
  params: any;
  result?: any;
  success?: boolean;
  executionTime?: number;
  error?: string;
}

/**
 * Loguje poziv MCP alata
 */
export async function logQuery(
  userId: string,
  toolName: string,
  params: any,
  result?: any,
  success?: boolean,
  executionTime?: number
): Promise<void> {
  try {
    // Određivanje tipa akcije
    let action = toolName;
    let severity: 'INFO' | 'WARNING' | 'ERROR' = 'INFO';

    // Mapiranje tool imena na action tipove
    if (toolName.startsWith('WRITE_')) {
      action = toolName.replace('WRITE_', '');
      severity = 'INFO';
    } else if (toolName.startsWith('get_')) {
      action = `READ_${toolName.toUpperCase()}`;
    } else if (toolName.startsWith('search_')) {
      action = `SEARCH_${toolName.toUpperCase()}`;
    } else if (toolName.startsWith('create_') || toolName.startsWith('update_') || toolName.startsWith('delete_')) {
      severity = 'INFO';
    }

    // Ako ima greške, postavi severity na ERROR
    if (success === false) {
      severity = 'ERROR';
    }

    // Pripremanje detalja
    const details: any = {
      params,
      executionTime
    };

    if (result) {
      details.resultSummary = summarizeResult(result);
    }

    // Upisivanje u bazu
    await db.activityLog.create({
      data: {
        action,
        entityType: 'mcp_tool',
        entityId: null, // MCP tool pozivi nemaju specifičan entity ID
        details: JSON.stringify(details),
        severity,
        userId
      }
    });
  } catch (error) {
    // Ne bacaj grešku - logging ne sme da blokira operacije
    console.error('Query logging failed:', error);
  }
}

/**
 * Sumarizuje rezultat za logging (da ne čuvamo cijele rezultate)
 */
function summarizeResult(result: any): any {
  if (!result) return null;

  if (typeof result === 'object') {
    if (Array.isArray(result)) {
      return {
        type: 'array',
        length: result.length,
        sample: result.slice(0, 2)
      };
    }

    if (result.success !== undefined) {
      return {
        success: result.success,
        hasData: !!result.data,
        error: result.error
      };
    }

    // Za objekte, čuvaj samo strukture
    const summary: any = {};
    for (const [key, value] of Object.entries(result)) {
      if (Array.isArray(value)) {
        summary[key] = `array(${value.length})`;
      } else if (typeof value === 'object' && value !== null) {
        summary[key] = 'object';
      } else {
        summary[key] = typeof value;
      }
    }
    return summary;
  }

  return result;
}

/**
 * Dobavi logove za korisnika
 */
export async function getUserQueryLogs(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<any[]> {
  try {
    const logs = await db.activityLog.findMany({
      where: {
        userId,
        entityType: 'mcp_tool'
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        action: true,
        details: true,
        severity: true,
        createdAt: true
      }
    });

    return logs.map(log => ({
      ...log,
      details: safeJsonParse(log.details)
    }));
  } catch (error) {
    console.error('Failed to get user query logs:', error);
    return [];
  }
}

/**
 * Dobavi statistiku korišćenja alata
 */
export async function getToolUsageStats(
  userId?: string,
  startDate?: Date,
  endDate?: Date
): Promise<any> {
  try {
    const where: any = {
      entityType: 'mcp_tool'
    };

    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const logs = await db.activityLog.findMany({
      where,
      select: {
        action: true,
        createdAt: true,
        severity: true
      }
    });

    // Agregacija po alatima
    const toolStats: Record<string, { count: number; errors: number }> = {};

    logs.forEach(log => {
      if (!toolStats[log.action]) {
        toolStats[log.action] = { count: 0, errors: 0 };
      }
      toolStats[log.action].count++;
      if (log.severity === 'ERROR') {
        toolStats[log.action].errors++;
      }
    });

    return {
      total: logs.length,
      byTool: toolStats,
      period: {
        start: startDate,
        end: endDate
      }
    };
  } catch (error) {
    console.error('Failed to get tool usage stats:', error);
    return { total: 0, byTool: {} };
  }
}

/**
 * Dobavi najčešće korišćene alate
 */
export async function getMostUsedTools(
  userId?: string,
  limit: number = 10
): Promise<Array<{ toolName: string; count: number }>> {
  try {
    const where: any = {
      entityType: 'mcp_tool'
    };

    if (userId) {
      where.userId = userId;
    }

    const logs = await db.activityLog.groupBy({
      by: ['action'],
      where,
      _count: {
        action: true
      },
      orderBy: {
        _count: {
          action: 'desc'
        }
      },
      take: limit
    });

    return logs.map(log => ({
      toolName: log.action,
      count: log._count.action
    }));
  } catch (error) {
    console.error('Failed to get most used tools:', error);
    return [];
  }
}

/**
 * Bezbedno parsiranje JSON-a
 */
function safeJsonParse(jsonString: string | null): any {
  if (!jsonString) return null;
  
  try {
    return JSON.parse(jsonString);
  } catch {
    return jsonString;
  }
}

/**
 * Očisti stare logove (cleanup task)
 */
export async function cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await db.activityLog.deleteMany({
      where: {
        entityType: 'mcp_tool',
        createdAt: {
          lt: cutoffDate
        }
      }
    });

    console.log(`Cleaned up ${result.count} old MCP query logs`);
    return result.count;
  } catch (error) {
    console.error('Failed to cleanup old logs:', error);
    return 0;
  }
}