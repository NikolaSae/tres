// Path: actions/security/get-performance-metrics.ts

"use server";

import { db } from "@/lib/db";
import { ActivityLog } from "@prisma/client";
import { subHours } from "date-fns";

interface PerformanceDataPoint {
  timestamp: string;
  responseTime: number;
  requestCount: number;
  errorRate: number;
  cpuUsage: number | null;
  memoryUsage: number | null;
}

interface GetPerformanceMetricsResult {
  data: PerformanceDataPoint[];
  avgResponseTime: number | null;
  requestCount24h: number | null;
  errorRate24h: number | null;
  activeUsers: number | null;
}

export const getPerformanceMetrics = async (): Promise<GetPerformanceMetricsResult> => {
  try {
    const defaultTimeRangeStart = subHours(new Date(), 24);

    const relevantLogs = await db.activityLog.findMany({
      where: {
        createdAt: {
          gte: defaultTimeRangeStart,
        },
        details: { not: null },
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
         id: true,
         createdAt: true,
         details: true,
      }
    });

    const performanceDataPoints: PerformanceDataPoint[] = relevantLogs
        .map(log => {
            try {
                const parsedDetails = log.details ? JSON.parse(log.details) : {};
                return {
                    timestamp: log.createdAt.toISOString(),
                    responseTime: typeof parsedDetails.responseTime === 'number' ? parsedDetails.responseTime : 0,
                    requestCount: typeof parsedDetails.requestCount === 'number' ? parsedDetails.requestCount : 0,
                    errorRate: typeof parsedDetails.errorRate === 'number' ? parsedDetails.errorRate : 0,
                    cpuUsage: typeof parsedDetails.cpuUsage === 'number' ? parsedDetails.cpuUsage : null,
                    memoryUsage: typeof parsedDetails.memoryUsage === 'number' ? parsedDetails.memoryUsage : null,
                };
            } catch (parseError) {
                console.error(`Failed to parse details for log ${log.id || 'unknown'}:`, log.details, parseError);
                return null;
            }
        })
        .filter(point => point !== null) as PerformanceDataPoint[];

    const totalResponseTime = performanceDataPoints.reduce((sum, metric) => sum + metric.responseTime, 0);
    const avgResponseTime = performanceDataPoints.length > 0 ? totalResponseTime / performanceDataPoints.length : null;

    const totalRequestCount = performanceDataPoints.reduce((sum, metric) => sum + metric.requestCount, 0);
    const requestCount24h = totalRequestCount;

    const totalErrors = performanceDataPoints.reduce((sum, metric) => sum + (metric.requestCount * (metric.errorRate / 100)), 0);
    const errorRate24h = totalRequestCount > 0 ? (totalErrors / totalRequestCount) * 100 : null;

    const activeUsers = null;

    return {
      data: performanceDataPoints,
      avgResponseTime: avgResponseTime,
      requestCount24h: requestCount24h,
      errorRate24h: errorRate24h,
      activeUsers: activeUsers,
    };

  } catch (error) {
    console.error('[GET_PERFORMANCE_METRICS_ACTION_ERROR]', error);
    return {
      data: [],
      avgResponseTime: null,
      requestCount24h: null,
      errorRate24h: null,
      activeUsers: null,
    };
  }
};