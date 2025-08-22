// actions/reports/get-recent-reports.ts
"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function getRecentReports(limit = 10) {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized access" };
    }
    
    // Get the most recently generated reports
    const reports = await db.generatedReport.findMany({
      orderBy: {
        generatedAt: "desc",
      },
      take: limit,
    });
    
    return { success: true, data: reports };
  } catch (error) {
    console.error("Failed to fetch recent reports:", error);
    return { error: "Failed to fetch recent reports. Please try again." };
  }
}

export async function getScheduledReports(params?: {
  isActive?: boolean;
  reportType?: string;
}) {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized access" };
    }
    
    // Build query conditions
    const where: any = {};
    
    if (params?.isActive !== undefined) {
      where.isActive = params.isActive;
    }
    
    if (params?.reportType) {
      where.reportType = params.reportType;
    }
    
    // Get all scheduled reports
    const reports = await db.scheduledReport.findMany({
      where,
      orderBy: {
        nextRun: "asc",
      },
    });
    
    return { success: true, data: reports };
  } catch (error) {
    console.error("Failed to fetch scheduled reports:", error);
    return { error: "Failed to fetch scheduled reports. Please try again." };
  }
}

export async function getReportsByType(reportType: string, limit = 20) {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized access" };
    }
    
    // Get reports of the specified type
    const reports = await db.generatedReport.findMany({
      where: {
        reportType,
      },
      orderBy: {
        generatedAt: "desc",
      },
      take: limit,
    });
    
    return { success: true, data: reports };
  } catch (error) {
    console.error(`Failed to fetch ${reportType} reports:`, error);
    return { error: `Failed to fetch ${reportType} reports. Please try again.` };
  }
}

export async function getReportDetail(id: string) {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized access" };
    }
    
    // Get report details
    const report = await db.generatedReport.findUnique({
      where: {
        id,
      },
    });
    
    if (!report) {
      return { error: "Report not found" };
    }
    
    return { success: true, data: report };
  } catch (error) {
    console.error("Failed to fetch report details:", error);
    return { error: "Failed to fetch report details. Please try again." };
  }
}