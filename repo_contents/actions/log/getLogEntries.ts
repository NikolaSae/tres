// /actions/log/getLogEntries.ts
"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { LogEntityType, LogActionType, LogStatus } from "@prisma/client";
import { z } from "zod";

const getLogEntriesSchema = z.object({
  entityType: z.nativeEnum(LogEntityType),
  entityId: z.string().optional().nullable(),

  action: z.nativeEnum(LogActionType).optional().nullable().transform(e => e === 'ALL' ? undefined : e),
  status: z.nativeEnum(LogStatus).optional().nullable().transform(e => e === 'ALL' ? undefined : e),
  subjectKeyword: z.string().optional().nullable().transform(e => e?.trim() === '' ? undefined : e),
  dateFrom: z.preprocess((arg) => { if (typeof arg == "string" || arg instanceof Date) return new Date(arg); }, z.date().optional().nullable()),
  dateTo: z.preprocess((arg) => { if (typeof arg == "string" || arg instanceof Date) return new Date(arg); }, z.date().optional().nullable()),

  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
});

export type GetLogEntriesInput = z.infer<typeof getLogEntriesSchema>;

type LogEntryWithRelations = {
    id: string;
    action: LogActionType;
    subject: string;
    description: string | null;
    status: LogStatus;
    createdAt: Date;
    updatedAt: Date;
    createdBy: {
        id: string;
        name: string | null;
    };
    updatedBy: { // Dodata updatedBy relacija u tip
        id: string;
        name: string | null;
    } | null;
    sendEmail: boolean;
    provider: {
        id: string;
        name: string;
    } | null;
    entityType: LogEntityType;
    entityId: string;
    providerId: string | null;
    parkingServiceId: string | null;
    bulkServiceId: string | null;
    createdById: string;
    updatedById: string | null;
};

interface GetLogEntriesResult {
    success: boolean;
    data?: {
        logs: LogEntryWithRelations[];
        total: number;
    };
    error?: string;
}

export async function getLogEntries(
  params: GetLogEntriesInput
): Promise<GetLogEntriesResult> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const validatedParams = getLogEntriesSchema.safeParse(params);

    if (!validatedParams.success) {
      console.error("Log entry fetch validation failed:", validatedParams.error.errors);
      return { success: false, error: "Invalid input parameters." };
    }

    const { entityType, entityId, action, status, subjectKeyword, dateFrom, dateTo, page, limit } = validatedParams.data;

    const where: any = {
      entityType: entityType,
    };

    if (entityId) {
        where.entityId = entityId;
    }
    if (action) {
        where.action = action;
    }
    if (status) {
        where.status = status;
    }
    if (subjectKeyword) {
        where.subject = {
            contains: subjectKeyword,
            mode: 'insensitive',
        };
    }
     if (dateFrom) {
         where.createdAt = { ...where.createdAt, gte: dateFrom };
     }
     if (dateTo) {
         const dateToInclusive = new Date(dateTo);
         dateToInclusive.setHours(23, 59, 59, 999);
         where.createdAt = { ...where.createdAt, lte: dateToInclusive };
     }

    const skip = (page - 1) * limit;

    const [logs, total] = await db.$transaction([
      db.logEntry.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          updatedBy: { // Uključujemo updatedBy relaciju
              select: {
                  id: true,
                  name: true,
              }
          },
          provider: {
              select: {
                  id: true,
                  name: true,
              }
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      db.logEntry.count({ where }),
    ]);

    return {
        success: true,
        data: {
            logs: logs as LogEntryWithRelations[],
            total: total,
        }
    };

  } catch (error) {
    console.error("[GET_LOG_ENTRIES_ERROR]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch log entries.",
    };
  }
}
