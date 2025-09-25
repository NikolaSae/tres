// Path: actions/security/metrics.ts
"use server";

import { db } from "@/lib/db";
import { LogSeverity } from "@prisma/client";
import { subDays } from "date-fns";

// (Keep getCriticalAlertMetrics from previous step)
export async function getCriticalAlertMetrics() {
  const now = new Date();
  const twentyFourHoursAgo = subDays(now, 1);
  const fortyEightHoursAgo = subDays(now, 2);

  try {
    const criticalLast24h = await db.activityLog.count({
      where: {
        severity: LogSeverity.CRITICAL,
        createdAt: { gte: twentyFourHoursAgo },
      },
    });

    const criticalPrevious24h = await db.activityLog.count({
      where: {
        severity: LogSeverity.CRITICAL,
        createdAt: { gte: fortyEightHoursAgo, lt: twentyFourHoursAgo },
      },
    });

    let changePercentage = 0;
    let changePositive = true;

    if (criticalPrevious24h > 0) {
      const change = criticalLast24h - criticalPrevious24h;
      changePercentage = Math.round((change / criticalPrevious24h) * 100);
      changePositive = change >= 0;
      changePercentage = Math.abs(changePercentage);
    } else if (criticalLast24h > 0) {
        changePercentage = 100;
        changePositive = true;
    } else {
        changePercentage = 0;
        changePositive = true;
    }

    return {
      criticalLast24h,
      changePercentage,
      changePositive,
    };

  } catch (error) {
    console.error("Error fetching critical alert metrics:", error);
    return { criticalLast24h: 'Error', changePercentage: null, changePositive: true };
  }
}

// New function for Warning Events
export async function getWarningEventMetrics() {
    const now = new Date();
    const twentyFourHoursAgo = subDays(now, 1);
    const fortyEightHoursAgo = subDays(now, 2);

    try {
        // Broj Warning logova u poslednja 24 sata
        const warningLast24h = await db.activityLog.count({
          where: {
            severity: LogSeverity.WARNING,
            createdAt: { gte: twentyFourHoursAgo },
          },
        });

        // Broj Warning logova u prethodna 24 sata
        const warningPrevious24h = await db.activityLog.count({
          where: {
            severity: LogSeverity.WARNING,
            createdAt: { gte: fortyEightHoursAgo, lt: twentyFourHoursAgo },
          },
        });

        // Izračunavamo procenat promene
        let changePercentage = 0;
        let changePositive = true;

        if (warningPrevious24h > 0) {
          const change = warningLast24h - warningPrevious24h;
          changePercentage = Math.round((change / warningPrevious24h) * 100);
          changePositive = change >= 0;
          changePercentage = Math.abs(changePercentage);
        } else if (warningLast24h > 0) {
            changePercentage = 100;
            changePositive = true;
        } else {
            changePercentage = 0;
            changePositive = true;
        }

        return {
          warningLast24h,
          changePercentage,
          changePositive,
        };

    } catch (error) {
        console.error("Error fetching warning event metrics:", error);
        return { warningLast24h: 'Error', changePercentage: null, changePositive: true };
    }
}


// New function for Recent Active User Count (based on logs in last 24h)
export async function getRecentActiveUserCount() {
    const now = new Date();
    const twentyFourHoursAgo = subDays(now, 1);

    try {
        // Count distinct user IDs from ActivityLogs in the last 24 hours
        // Note: This counts users who performed *any* logged action, not necessarily "online" users.
        const recentUserActivity = await db.activityLog.findMany({
            where: {
                createdAt: {
                    gte: twentyFourHoursAgo,
                },
                // Exclude system actions that might not be linked to a user
                userId: {
                   not: null
                }
            },
            select: {
                userId: true,
            },
            distinct: ['userId'], // Get only unique user IDs
        });

        // The count is the number of unique user IDs found
        const activeUserCount = recentUserActivity.length;

        return {
            activeUserCount,
        };

    } catch (error) {
        console.error("Error fetching recent active user count:", error);
        return { activeUserCount: 'Error' }; // Return 'Error' on failure
    }
}

// API Response Time - Cannot be calculated with current schema.
// Data related to API response times would need to be explicitly logged in a dedicated table.