"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/actions/security/log-event";

/**
 * Fetches all scheduled reports
 * Can be filtered by isActive status
 */
export async function getScheduledReports(filters?: { isActive?: boolean }) {
  try {
    // Get current user for authentication
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Unauthorized access");
    }

    // Build query with optional filters
    const whereClause: any = {};
    if (filters?.isActive !== undefined) {
      whereClause.isActive = filters.isActive;
    }

    // Fetch scheduled reports
    const scheduledReports = await db.scheduledReport.findMany({
      where: whereClause,
      orderBy: [
        { isActive: 'desc' },
        { nextRun: 'asc' }
      ],
    });

    // Log the activity
    await logActivity({
      action: "VIEW_SCHEDULED_REPORTS",
      entityType: "report",
      entityId: null,
      details: "Viewed scheduled reports list",
    });

    return scheduledReports;
  } catch (error) {
    console.error("Failed to fetch scheduled reports:", error);
    // Return empty array on error so the UI can handle it gracefully
    return [];
  }
}

/**
 * Fetches a single scheduled report by ID
 */
export async function getScheduledReportById(id: string) {
  try {
    // Get current user for authentication
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized access" };
    }

    // Fetch the scheduled report
    const scheduledReport = await db.scheduledReport.findUnique({
      where: { id },
    });

    if (!scheduledReport) {
      return { error: "Scheduled report not found" };
    }

    // Log the activity
    await logActivity({
      action: "VIEW_SCHEDULED_REPORT",
      entityType: "report",
      entityId: id,
      details: `Viewed scheduled report: ${scheduledReport.name}`,
    });

    return { success: true, data: scheduledReport };
  } catch (error) {
    console.error("Failed to fetch scheduled report:", error);
    return { error: "Failed to fetch scheduled report" };
  }
}

/**
 * Toggles the active status of a scheduled report
 */
export async function toggleScheduledReportStatus(id: string) {
  try {
    // Get current user for authentication
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized access" };
    }

    // Find the current report to get its status
    const currentReport = await db.scheduledReport.findUnique({
      where: { id },
      select: { isActive: true, name: true },
    });

    if (!currentReport) {
      return { error: "Scheduled report not found" };
    }

    // Toggle the status
    const updatedReport = await db.scheduledReport.update({
      where: { id },
      data: {
        isActive: !currentReport.isActive,
        updatedAt: new Date(),
      },
    });

    // Log the activity
    await logActivity({
      action: currentReport.isActive ? "DISABLE_SCHEDULED_REPORT" : "ENABLE_SCHEDULED_REPORT",
      entityType: "report",
      entityId: id,
      details: `${currentReport.isActive ? "Disabled" : "Enabled"} scheduled report: ${currentReport.name}`,
    });

    return { success: true, data: updatedReport };
  } catch (error) {
    console.error("Failed to toggle scheduled report status:", error);
    return { error: "Failed to update scheduled report status" };
  }
}