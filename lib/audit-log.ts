// lib/audit-log.ts
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { LogSeverity } from "@prisma/client";

export enum AuditAction {
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  LOGIN_FAILED = "LOGIN_FAILED",
  PASSWORD_CHANGED = "PASSWORD_CHANGED",
  CONTRACT_CREATED = "CONTRACT_CREATED",
  CONTRACT_UPDATED = "CONTRACT_UPDATED",
  CONTRACT_DELETED = "CONTRACT_DELETED",
  CONTRACT_VIEWED = "CONTRACT_VIEWED",
  CONTRACT_EXPORTED = "CONTRACT_EXPORTED",
  FILE_UPLOADED = "FILE_UPLOADED",
  FILE_DELETED = "FILE_DELETED",
  FILE_DOWNLOADED = "FILE_DOWNLOADED",
  USER_CREATED = "USER_CREATED",
  USER_UPDATED = "USER_UPDATED",
  USER_DELETED = "USER_DELETED",
  ROLE_CHANGED = "ROLE_CHANGED",
  PROVIDER_CREATED = "PROVIDER_CREATED",
  PROVIDER_UPDATED = "PROVIDER_UPDATED",
  PROVIDER_DELETED = "PROVIDER_DELETED",
  DATA_IMPORTED = "DATA_IMPORTED",
  REPORT_GENERATED = "REPORT_GENERATED",
  UNAUTHORIZED_ACCESS = "UNAUTHORIZED_ACCESS",
  SETTINGS_CHANGED = "SETTINGS_CHANGED",
}

interface AuditLogParams {
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  success?: boolean;
  errorMessage?: string;
  userId?: string;
  userEmail?: string;
}

export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    const session = await auth();
    const headersList = await headers(); // ✅ async u Next.js 16

    const userId = params.userId || session?.user?.id;
    if (!userId) return; // ActivityLog zahteva userId

    const ipAddress =
      headersList.get("x-forwarded-for") ||
      headersList.get("x-real-ip") ||
      "unknown";

    const userAgent = headersList.get("user-agent") || "unknown";
    const requestPath = headersList.get("x-invoke-path") || undefined;

    // Spakovati sve detalje u details polje kao JSON
    const detailsPayload = {
      entityName: params.entityName,
      oldValues: params.oldValues,
      newValues: params.newValues,
      metadata: params.metadata,
      success: params.success ?? true,
      errorMessage: params.errorMessage,
      userEmail: params.userEmail || session?.user?.email,
      userRole: (session?.user as { role?: string })?.role,
      ipAddress,
      userAgent,
      requestPath,
    };

    await db.activityLog.create({
      data: {
        action: params.action,
        entityType: params.entityType ?? "SYSTEM",
        entityId: params.entityId,
        details: JSON.stringify(detailsPayload),
        severity: params.success === false ? LogSeverity.WARNING : LogSeverity.INFO,
        userId,
      },
    });
  } catch (error) {
    console.error("[AUDIT_LOG_ERROR]", error);
  }
}

interface GetAuditLogsParams {
  userId?: string;
  action?: AuditAction;
  entityType?: string;
  entityId?: string;
  from?: Date;
  to?: Date;
  page?: number;
  pageSize?: number;
}

export async function getAuditLogs(params: GetAuditLogsParams = {}) {
  const { page = 1, pageSize = 50 } = params;

  const where = {
    ...(params.userId && { userId: params.userId }),
    ...(params.action && { action: params.action }),
    ...(params.entityType && { entityType: params.entityType }),
    ...(params.entityId && { entityId: params.entityId }),
    ...(params.from || params.to
      ? {
          createdAt: {
            ...(params.from && { gte: params.from }),
            ...(params.to && { lte: params.to }),
          },
        }
      : {}),
  };

  const [logs, total] = await Promise.all([
    db.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
    db.activityLog.count({ where }),
  ]);

  // Deserijalizuj details nazad u objekat za lakše korišćenje
  const parsedLogs = logs.map(log => ({
    ...log,
    details: (() => {
      try {
        return log.details ? JSON.parse(log.details) : null;
      } catch {
        return log.details;
      }
    })(),
  }));

  return {
    logs: parsedLogs,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}