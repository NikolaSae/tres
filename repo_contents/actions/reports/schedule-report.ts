///actions/reports/schedule-report.ts

"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { ReportFrequency } from "@prisma/client";
import { getNextRunDate } from "@/lib/reports/scheduled-jobs";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/actions/security/log-event";

// Schema for validating report scheduling input
const ScheduleReportSchema = z.object({
  name: z.string().min(3, "Report name must be at least 3 characters"),
  description: z.string().optional(),
  reportType: z.string().min(1, "Report type is required"),
  frequency: z.nativeEnum(ReportFrequency),
  parameters: z.record(z.any()).optional(),
});

export type ScheduleReportInput = z.infer<typeof ScheduleReportSchema>;

export async function scheduleReport(data: ScheduleReportInput) {
  try {
    // Validate input
    const validatedData = ScheduleReportSchema.parse(data);
    
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized access" };
    }
    
    // Calculate next run date based on frequency
    const nextRun = getNextRunDate(validatedData.frequency);
    
    // Create the scheduled report
    const scheduledReport = await db.scheduledReport.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        reportType: validatedData.reportType,
        frequency: validatedData.frequency,
        parameters: validatedData.parameters || {},
        nextRun,
      },
    });
    
    // Log the activity
    await logActivity({
      action: "SCHEDULE_REPORT",
      entityType: "report",
      entityId: scheduledReport.id,
      details: `Scheduled ${validatedData.reportType} report: ${validatedData.name}`,
    });
    
    return { success: true, data: scheduledReport };
  } catch (error) {
    console.error("Failed to schedule report:", error);
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to schedule report. Please try again." };
  }
}

export async function updateScheduledReport(
  id: string,
  data: ScheduleReportInput
) {
  try {
    // Validate input
    const validatedData = ScheduleReportSchema.parse(data);
    
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized access" };
    }
    
    // Check if report exists
    const existingReport = await db.scheduledReport.findUnique({
      where: { id },
    });
    
    if (!existingReport) {
      return { error: "Scheduled report not found" };
    }
    
    // Calculate next run date if frequency changed
    let nextRun = existingReport.nextRun;
    if (existingReport.frequency !== validatedData.frequency) {
      nextRun = getNextRunDate(validatedData.frequency);
    }
    
    // Update the scheduled report
    const updatedReport = await db.scheduledReport.update({
      where: { id },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        reportType: validatedData.reportType,
        frequency: validatedData.frequency,
        parameters: validatedData.parameters || {},
        nextRun,
        updatedAt: new Date(),
      },
    });
    
    // Log the activity
    await logActivity({
      action: "UPDATE_SCHEDULED_REPORT",
      entityType: "report",
      entityId: updatedReport.id,
      details: `Updated scheduled report: ${validatedData.name}`,
    });
    
    return { success: true, data: updatedReport };
  } catch (error) {
    console.error("Failed to update scheduled report:", error);
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to update scheduled report. Please try again." };
  }
}

export async function deleteScheduledReport(id: string) {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized access" };
    }
    
    // Check if report exists
    const existingReport = await db.scheduledReport.findUnique({
      where: { id },
    });
    
    if (!existingReport) {
      return { error: "Scheduled report not found" };
    }
    
    // Delete the scheduled report
    await db.scheduledReport.delete({
      where: { id },
    });
    
    // Log the activity
    await logActivity({
      action: "DELETE_SCHEDULED_REPORT",
      entityType: "report",
      entityId: id,
      details: `Deleted scheduled report: ${existingReport.name}`,
    });
    
    return { success: true };
  } catch (error) {
    console.error("Failed to delete scheduled report:", error);
    return { error: "Failed to delete scheduled report. Please try again." };
  }
}