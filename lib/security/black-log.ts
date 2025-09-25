//lib/security/black-log.ts

import { db } from "@/lib/db";
import { LogBlackType } from "@prisma/client";

interface LogParams {
  action: LogBlackType;
  entityId: string;
  entityType?: string;
  userId: string;
  oldData?: any;
  newData?: any;
}

export async function createAuditLog(params: LogParams) {
  try {
    console.log("Creating audit log with params:", params); // DEBUG
    
    const result = await db.blacklistLog.create({
      data: {
        action: params.action,
        entityId: params.entityId,
        entityType: params.entityType || "SenderBlacklist",
        userId: params.userId,
        oldData: params.oldData ? JSON.parse(JSON.stringify(params.oldData)) : undefined,
        newData: params.newData ? JSON.parse(JSON.stringify(params.newData)) : undefined,
      }
    });
    
    console.log("Audit log created successfully:", result.id); // DEBUG
    return result;
  } catch (error) {
    console.error("Failed to create audit log:", error);
    throw error; // Re-throw to see if this is causing transaction rollback
  }
}