// actions/blacklist/get-blacklist-logs.ts
"use server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

interface GetBlacklistLogsParams {
  filters?: {
    search?: string;
    action?: string;
    dateFrom?: Date;
    dateTo?: Date;
  };
  pagination: {
    page: number;
    limit: number;
  };
}

async function fetchBlacklistLogs(
  search: string | undefined,
  action: string | undefined,
  dateFrom: Date | undefined,
  dateTo: Date | undefined,
  page: number,
  limit: number
) {
  "use cache";
  
  console.log('🔍 Fetching blacklist logs from database...');
  
  const skip = (page - 1) * limit;
  const where: any = {};

  if (search) {
    where.OR = [
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
      { blacklistEntry: { senderName: { contains: search, mode: 'insensitive' } } },
    ];
  }

  if (action) where.action = action;

  if (dateFrom || dateTo) {
    where.timestamp = {};
    if (dateFrom) where.timestamp.gte = dateFrom;
    if (dateTo) {
      const dateToEnd = new Date(dateTo);
      dateToEnd.setHours(23, 59, 59, 999);
      where.timestamp.lte = dateToEnd;
    }
  }

  const [logs, total] = await db.$transaction([
    db.blacklistLog.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        blacklistEntry: {
          select: { id: true, senderName: true },
        },
      },
      orderBy: { timestamp: "desc" },
      skip,
      take: limit,
    }),
    db.blacklistLog.count({ where }),
  ]);

  return { logs, total };
}

export async function getBlacklistLogs({ filters = {}, pagination }: GetBlacklistLogsParams) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized", data: { logs: [], total: 0 } };
    }
    if (currentUser.role !== "ADMIN") {
      return { success: false, error: "Forbidden", data: { logs: [], total: 0 } };
    }

    const data = await fetchBlacklistLogs(
      filters.search,
      filters.action,
      filters.dateFrom,
      filters.dateTo,
      pagination.page,
      pagination.limit
    );

    return { success: true, data };
  } catch (error) {
    console.error("[GET_BLACKLIST_LOGS_ERROR]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch blacklist logs",
      data: { logs: [], total: 0 },
    };
  }
}