// actions/parking-services/logReportSend.ts
"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { LogSeverity } from "@prisma/client";

interface LogReportSendParams {
  serviceId: string;
  serviceName: string;
  recipients: string[];
  reportCount: number;
  year: string;
  month: string;
  success: boolean;
  errorMessage?: string;
}

export async function logReportSend({
  serviceId,
  serviceName,
  recipients,
  reportCount,
  year,
  month,
  success,
  errorMessage,
}: LogReportSendParams) {
  try {
    const session = await auth();
    const userId = session?.user?.id || 'system';

    // Log to activity log
    await db.activityLog.create({
      data: {
        entityType: 'ParkingService',
        entityId: serviceId,
        action: success ? 'REPORT_SENT' : 'REPORT_SEND_FAILED',
        details: success 
          ? `Sent ${reportCount} report(s) for ${month}/${year} to ${recipients.join(', ')}`
          : `Failed to send reports for ${month}/${year}: ${errorMessage}`,
        severity: success ? LogSeverity.INFO : LogSeverity.ERROR,
        userId,
      },
    });

    // Update parking service with last send info (if these fields exist)
    if (success) {
      try {
        await db.parkingService.update({
          where: { id: serviceId },
          data: {
            updatedAt: new Date(),
            // Add these fields to your ParkingService model if needed:
            // lastReportSentAt: new Date(),
            // totalReportsSent: { increment: reportCount },
          },
        });
      } catch (updateError) {
        console.warn("Could not update parking service:", updateError);
        // Don't fail the whole operation if update fails
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error logging report send:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}