// actions/blacklist/get-blacklist-logs.ts

"use server";

import { db } from "@/lib/db";

export async function getBlacklistLogs() {
  try {
    const logs = await db.blacklistLog.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        blacklistEntry: {
          select: {
            id: true,
            senderName: true
          }
        }
      },
      orderBy: {
        timestamp: "desc"
      },
      take: 100 // Limit to 100 most recent logs
    });

    return logs;
  } catch (error) {
    console.error("Failed to fetch blacklist logs:", error);
    return [];
  }
}