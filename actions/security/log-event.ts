// Path: actions/security/log-event.ts

"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { LogSeverity, ActivityLog as PrismaActivityLog } from "@prisma/client";

interface GetActivityLogsFilters {
  severity?: LogSeverity;
  entityType?: string;
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  action?: string;
  page?: number;
  limit?: number;
}

interface GetActivityLogsResult {
  logs: (PrismaActivityLog & { user: { id: string; name: string | null; email: string; role: string } | null })[];
  total: number;
}

export async function getActivityLogs(filters: GetActivityLogsFilters): Promise<GetActivityLogsResult> {
  try {
    const session = await auth();

    if (!session || !session.user || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
      return { logs: [], total: 0 };
    }

    const whereConditions: any = {};

    if (filters.severity) whereConditions.severity = filters.severity;
    if (filters.entityType) whereConditions.entityType = filters.entityType;
    if (filters.userId) whereConditions.userId = filters.userId;
    if (filters.action) whereConditions.action = filters.action;

    if (filters.startDate || filters.endDate) {
      whereConditions.createdAt = {};
      if (filters.startDate) whereConditions.createdAt.gte = filters.startDate;
      if (filters.endDate) {
        const endDatePlusOneDay = new Date(filters.endDate);
        endDatePlusOneDay.setDate(endDatePlusOneDay.getDate() + 1);
        whereConditions.createdAt.lt = endDatePlusOneDay;
      }
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      db.activityLog.findMany({
        where: whereConditions,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      db.activityLog.count({ where: whereConditions }),
    ]);

    return { logs, total };
  } catch (error) {
    console.error("[GET_ACTIVITY_LOGS_ACTION_ERROR]", error);
    return { logs: [], total: 0 };
  }
}

export async function logEvent(input: {
  action: string;
  entityType?: string;
  entityId?: string;
  details?: string;
  severity?: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  userId?: string;
}) {
  console.info("[LOG_EVENT]", input);
}

export const logActivity = logEvent;