// actions/parking-services/logReportSend.ts
"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";

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
        description: success 
          ? `Sent ${reportCount} report(s) for ${month}/${year} to ${recipients.join(', ')}`
          : `Failed to send reports for ${month}/${year}: ${errorMessage}`,
        level: success ? 'INFO' : 'ERROR',
        errorDetails: errorMessage,
        userId,
        timestamp: new Date(),
      },
    });

    // Update parking service with last send info (opciono)
    if (success) {
      await db.parkingService.update({
        where: { id: serviceId },
        data: {
          lastReportSentAt: new Date(),
          totalReportsSent: {
            increment: reportCount,
          },
        },
      });
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