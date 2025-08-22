// lib/security/audit-logger.ts
import { db } from "@/lib/db";
import { LogSeverity } from "@prisma/client";
import { getCurrentUser } from "./auth-helpers";

interface LogOptions {
  entityType: string;
  entityId?: string;
  details?: string;
  severity?: LogSeverity;
  userId?: string; // Added userId to options
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
  
  return db.activityLog.create({  // Changed prisma to db to match imports
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