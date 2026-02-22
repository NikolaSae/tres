// lib/security/audit-logger.ts
import { db } from "@/lib/db";
import { LogSeverity } from "@prisma/client";
import { getCurrentUser } from "./auth-helpers";

interface LogOptions {
  entityType: string;
  entityId?: string;
  details?: string | Record<string, unknown>;
  severity?: LogSeverity;
  userId?: string;
}

interface ActivityLogParams {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  severity?: LogSeverity;
}

export async function logActivity(action: string, options: LogOptions) {
  let userId = options.userId;

  if (!userId) {
    const user = await getCurrentUser();
    if (!user?.id) {
      console.error("No authenticated user for activity log");
      return;
    }
    userId = user.id;
  }

  const { entityType, entityId, details, severity = LogSeverity.INFO } = options;

  let detailsString: string | null = null;
  if (details) {
    if (typeof details === "string") {
      detailsString = details;
    } else {
      try {
        detailsString = JSON.stringify(details);
      } catch (e) {
        console.error("Failed to stringify details for log:", e);
        detailsString = "Error serializing details";
      }
    }
  }

  return db.activityLog.create({
    data: {
      action,
      entityType,
      entityId,
      details: detailsString,
      severity,
      userId,
    },
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
  let detailsString: string | null = null;
  if (details) {
    try {
      detailsString = JSON.stringify(details);
    } catch (e) {
      console.error("Failed to stringify details:", e);
      detailsString = "Error serializing details";
    }
  }

  return db.activityLog.create({
    data: {
      action,
      entityType: resource,
      entityId: resourceId,
      details: detailsString,
      severity,
      userId,
    },
  });
}