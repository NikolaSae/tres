// lib/security/audit-logger.ts
import { db } from "@/lib/db";
import { LogSeverity } from "@prisma/client";
import { getCurrentUser } from "./auth-helpers";

interface LogOptions {
  entityType: string;
  entityId?: string;
  details?: string;
  severity?: LogSeverity;
  userId?: string;
}

interface ActivityLogParams {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  severity?: LogSeverity;
}

export async function logActivity(
  action: string,
  options: LogOptions
) {
  let userId = options.userId;
  
  // If userId is not provided, try to get current user
  if (!userId) {
    const user = await getCurrentUser();
    if (!user) {
      console.error("No authenticated user for activity log");
      return;
    }
    userId = user.id;
  }
  
  const { entityType, entityId, details, severity = LogSeverity.INFO } = options;
  
  return db.activityLog.create({
    data: {
      action,
      entityType,
      entityId,
      details,
      severity,
      userId,
    }
  });
}

export async function createActivityLog({
  userId,
  action,
  resource,
  resourceId,
  details,
  severity = LogSeverity.INFO,
}: ActivityLogParams) {
  return db.activityLog.create({
    data: {
      action,
      entityType: resource,
      entityId: resourceId,
      details: details ? JSON.stringify(details) : undefined,
      severity,
      userId,
    }
  });
}