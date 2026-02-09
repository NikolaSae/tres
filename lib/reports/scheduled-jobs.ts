//lib/reports/scheduled-jobs.ts
import { ReportFrequency } from "@prisma/client";

/**
 * Calculate the next run date based on the report frequency
 */
export function getNextRunDate(frequency: ReportFrequency): Date {
  const now = new Date();
  const nextRun = new Date(now);

  switch (frequency) {
    case ReportFrequency.DAILY:
      // Next day at midnight
      nextRun.setDate(nextRun.getDate() + 1);
      nextRun.setHours(0, 0, 0, 0);
      break;

    case ReportFrequency.WEEKLY:
      // Next Monday at midnight
      const daysUntilMonday = (8 - nextRun.getDay()) % 7 || 7;
      nextRun.setDate(nextRun.getDate() + daysUntilMonday);
      nextRun.setHours(0, 0, 0, 0);
      break;

    case ReportFrequency.MONTHLY:
      // First day of next month at midnight
      nextRun.setMonth(nextRun.getMonth() + 1);
      nextRun.setDate(1);
      nextRun.setHours(0, 0, 0, 0);
      break;

    case ReportFrequency.QUARTERLY:
      // First day of next quarter at midnight
      const currentMonth = nextRun.getMonth();
      const nextQuarterMonth = Math.floor(currentMonth / 3) * 3 + 3;
      nextRun.setMonth(nextQuarterMonth);
      nextRun.setDate(1);
      nextRun.setHours(0, 0, 0, 0);
      break;

    case ReportFrequency.YEARLY:
      // First day of next year at midnight
      nextRun.setFullYear(nextRun.getFullYear() + 1);
      nextRun.setMonth(0);
      nextRun.setDate(1);
      nextRun.setHours(0, 0, 0, 0);
      break;

    default:
      // Default to next day if frequency is unknown
      nextRun.setDate(nextRun.getDate() + 1);
      nextRun.setHours(0, 0, 0, 0);
  }

  return nextRun;
}

/**
 * Check if a scheduled report should run now
 */
export function shouldRunNow(nextRun: Date): boolean {
  return new Date() >= nextRun;
}

/**
 * Get a human-readable description of the frequency
 */
export function getFrequencyDescription(frequency: ReportFrequency): string {
  const descriptions: Record<ReportFrequency, string> = {
    [ReportFrequency.DAILY]: "Every day at midnight",
    [ReportFrequency.WEEKLY]: "Every Monday at midnight",
    [ReportFrequency.MONTHLY]: "First day of every month at midnight",
    [ReportFrequency.QUARTERLY]: "First day of every quarter at midnight",
    [ReportFrequency.YEARLY]: "First day of every year at midnight",
  };

  return descriptions[frequency] || "Unknown frequency";
}