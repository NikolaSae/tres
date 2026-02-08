// lib/services/activity-log-service.ts

import { db } from "@/lib/db";
import { LogSeverity, LogActionType, LogEntityType } from "@prisma/client";

interface ActivityLogParams {
  action: string;
  entityType: string;
  entityId: string | null;
  details?: string;
  severity?: LogSeverity;
  userId: string;
}

export const ActivityLogService = {
  async log(params: ActivityLogParams) {
    if (!params || typeof params !== "object") {
      console.error("[ActivityLogService] log called with invalid or missing parameters. Received:", params);
      return;
    }

    const { action, entityType, entityId, details, severity = LogSeverity.INFO, userId } = params;

    if (!userId) {
      console.error("[ActivityLogService] log called with missing userId. Full params:", params);
      return;
    }

    try {
      return await db.activityLog.create({
        data: {
          action,
          entityType,
          entityId,
          details,
          severity,
          userId,
          createdAt: new Date(),
        },
      });
    } catch (error) {
      console.error(`ActivityLogService: Failed to create log entry for action "${action}":`, error);
      // Ne bacamo grešku dalje – logovanje ne sme da sruši glavnu operaciju
    }
  },
};