// actions/security/metrics.ts
"use server";

import { db } from "@/lib/db";
import { LogSeverity } from "@prisma/client";
import { subDays } from "date-fns";

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

export async function getWarningEventMetrics() {
  const now = new Date();
  const twentyFourHoursAgo = subDays(now, 1);
  const fortyEightHoursAgo = subDays(now, 2);

  try {
    const warningLast24h = await db.activityLog.count({
      where: {
        severity: LogSeverity.WARNING,
        createdAt: { gte: twentyFourHoursAgo },
      },
    });

    const warningPrevious24h = await db.activityLog.count({
      where: {
        severity: LogSeverity.WARNING,
        createdAt: { gte: fortyEightHoursAgo, lt: twentyFourHoursAgo },
      },
    });

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

export async function getRecentActiveUserCount() {
  const now = new Date();
  const twentyFourHoursAgo = subDays(now, 1);

  try {
    const recentUserActivity = await db.activityLog.findMany({
      where: {
        createdAt: {
          gte: twentyFourHoursAgo,
        },
        // Uklonjen nepotreban filter – Prisma automatski preskače null za non-nullable polja
        // Ako je userId nullable, koristi { userId: { not: null } } posle provere šeme
      },
      select: {
        userId: true,
      },
      distinct: ['userId'],
    });

    const activeUserCount = recentUserActivity.length;

    return {
      activeUserCount,
    };
  } catch (error) {
    console.error("Error fetching recent active user count:", error);
    return { activeUserCount: 'Error' };
  }
}