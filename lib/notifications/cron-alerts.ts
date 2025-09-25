////lib/notifications/cron-alerts.ts

import { db } from '@/lib/db';
import { NotificationType, ContractStatus } from '@prisma/client';
import { createNotification, notifyUsersByRole } from './in-app-notifier';
import { logEvent } from '@/actions/security/log-event';

/**
 * Check for contracts expiring soon and send notifications
 * This function should be triggered by a scheduled cron job
 */
export async function checkExpiringContracts() {
  try {
    const today = new Date();

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    const contracts30Days = await db.contract.findMany({
      where: {
        status: ContractStatus.ACTIVE,
        endDate: {
          gte: today,
          lte: thirtyDaysFromNow
        }
      },
      include: {
        provider: { select: { name: true } },
        humanitarianOrg: { select: { name: true } },
        parkingService: { select: { name: true } },
        createdBy: { select: { id: true, name: true, email: true } }
      }
    });

    const contracts7Days = await db.contract.findMany({
      where: {
        status: ContractStatus.ACTIVE,
        endDate: {
          gte: today,
          lte: sevenDaysFromNow
        }
      },
      include: {
        provider: { select: { name: true } },
        humanitarianOrg: { select: { name: true } },
        parkingService: { select: { name: true } },
        createdBy: { select: { id: true, name: true, email: true } }
      }
    });

    for (const contract of contracts30Days) {
      const contractName = contract.provider?.name || contract.humanitarianOrg?.name || contract.parkingService?.name || contract.name;
      const remainingDays = Math.ceil((contract.endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      const existingReminder = await db.contractReminder.findFirst({
        where: {
          contractId: contract.id,
          reminderType: 'expiration',
          reminderDate: {
            gte: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1),
            lte: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
          }
        }
      });

      if (!existingReminder) {
        await db.contractReminder.create({
          data: {
            contractId: contract.id,
            reminderDate: today,
            reminderType: 'expiration',
            isAcknowledged: false
          }
        });

        if (contract.createdBy) {
          await createNotification({
            userId: contract.createdBy.id,
            title: `Contract Expiring Soon`,
            message: `The contract "${contractName}" (${contract.contractNumber}) will expire in ${remainingDays} days.`,
            type: NotificationType.CONTRACT_EXPIRING,
            entityType: 'contract',
            entityId: contract.id
          });
        }

        await notifyUsersByRole({
          role: 'MANAGER',
          title: `Contract Expiring Soon`,
          message: `The contract "${contractName}" (${contract.contractNumber}) will expire in ${remainingDays} days.`,
          type: NotificationType.CONTRACT_EXPIRING,
          entityType: 'contract',
          entityId: contract.id
        });
      }
    }

    for (const contract of contracts7Days) {
      const contractName = contract.provider?.name || contract.humanitarianOrg?.name || contract.parkingService?.name || contract.name;
      const remainingDays = Math.ceil((contract.endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      const existingReminder = await db.contractReminder.findFirst({
        where: {
          contractId: contract.id,
          reminderType: 'expiration-urgent',
          reminderDate: {
            gte: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1),
            lte: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
          }
        }
      });

      if (!existingReminder) {
        await db.contractReminder.create({
          data: {
            contractId: contract.id,
            reminderDate: today,
            reminderType: 'expiration-urgent',
            isAcknowledged: false
          }
        });

        if (contract.createdBy) {
          await createNotification({
            userId: contract.createdBy.id,
            title: `URGENT: Contract Expires in ${remainingDays} Days`,
            message: `URGENT: The contract "${contractName}" (${contract.contractNumber}) will expire in ${remainingDays} days. Immediate action required.`,
            type: NotificationType.CONTRACT_EXPIRING,
            entityType: 'contract',
            entityId: contract.id
          });
        }

        await notifyUsersByRole({
          role: 'MANAGER',
          title: `URGENT: Contract Expires in ${remainingDays} Days`,
          message: `URGENT: The contract "${contractName}" (${contract.contractNumber}) will expire in ${remainingDays} days. Immediate action required.`,
          type: NotificationType.CONTRACT_EXPIRING,
          entityType: 'contract',
          entityId: contract.id
        });

        await notifyUsersByRole({
          role: 'ADMIN',
          title: `URGENT: Contract Expires in ${remainingDays} Days`,
          message: `URGENT: The contract "${contractName}" (${contract.contractNumber}) will expire in ${remainingDays} days. Immediate action required.`,
          type: NotificationType.CONTRACT_EXPIRING,
          entityType: 'contract',
          entityId: contract.id
        });
      }
    }

    await logEvent({
      action: 'CHECK_EXPIRING_CONTRACTS',
      entityType: 'system',
      details: `Checked ${contracts30Days.length} contracts expiring in 30 days and ${contracts7Days.length} contracts expiring in 7 days`,
      severity: 'INFO',
      userId: 'system'
    });

    return {
      success: true,
      checked30Days: contracts30Days.length,
      checked7Days: contracts7Days.length
    };
  } catch (error) {
    console.error('[CHECK_EXPIRING_CONTRACTS_ERROR]', error);

    await logEvent({
      action: 'CHECK_EXPIRING_CONTRACTS_ERROR',
      entityType: 'system',
      details: `Failed to check expiring contracts: ${(error as Error).message}`,
      severity: 'ERROR',
      userId: 'system'
    });

    throw error;
  }
}

/**
 * Check for unassigned complaints and send notifications
 * This function should be triggered by a scheduled cron job
 */
export async function checkUnassignedComplaints() {
  try {
    const today = new Date();
    const twentyFourHoursAgo = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    const unassignedComplaints = await db.complaint.findMany({
      where: {
        status: 'NEW',
        assignedAgentId: null,
        createdAt: {
          lt: twentyFourHoursAgo
        }
      }
    });

    if (unassignedComplaints.length > 0) {
      await notifyUsersByRole({
        role: 'MANAGER',
        title: `Unassigned Complaints Alert`,
        message: `There are ${unassignedComplaints.length} complaints that have been unassigned for more than 24 hours.`,
        type: NotificationType.SYSTEM,
        entityType: 'complaint',
        entityId: unassignedComplaints[0].id // Poveži obaveštenje sa prvom neassigniranom reklamacijom kao primer
      });
       // Opciono: Obavestiti i Admine
       await notifyUsersByRole({
         role: 'ADMIN',
         title: `Unassigned Complaints Alert`,
         message: `There are ${unassignedComplaints.length} complaints that have been unassigned for more than 24 hours.`,
         type: NotificationType.SYSTEM,
         entityType: 'complaint',
         entityId: unassignedComplaints[0].id
       });
    }

    await logEvent({
      action: 'CHECK_UNASSIGNED_COMPLAINTS',
      entityType: 'system',
      details: `Checked for unassigned complaints: found ${unassignedComplaints.length}`,
      severity: 'INFO',
      userId: 'system'
    });


    return { success: true, unassignedCount: unassignedComplaints.length };
  } catch (error) {
    console.error('[CHECK_UNASSIGNED_COMPLAINTS_ERROR]', error);

    await logEvent({
      action: 'CHECK_UNASSIGNED_COMPLAINTS_ERROR',
      entityType: 'system',
      details: `Failed to check unassigned complaints: ${(error as Error).message}`,
      severity: 'ERROR',
      userId: 'system'
    });

    throw error;
  }
}

/**
 * Check for scheduled reports that need to be generated
 * This function should be triggered by a scheduled cron job
 */
export async function checkScheduledReports() {
  try {
    const now = new Date();

    const reportsToRun = await db.scheduledReport.findMany({
      where: {
        isActive: true,
        OR: [
          { nextRun: { lte: now } },
          { nextRun: null }
        ]
      }
    });

    for (const report of reportsToRun) {
      try {
        let nextRun: Date | null = new Date(now); // Start calculating from 'now' for accuracy

        switch (report.frequency) {
          case 'DAILY':
            nextRun.setDate(nextRun.getDate() + 1);
            break;
          case 'WEEKLY':
            nextRun.setDate(nextRun.getDate() + 7);
            break;
          case 'MONTHLY':
            nextRun.setMonth(nextRun.getMonth() + 1);
            break;
          case 'QUARTERLY':
            nextRun.setMonth(nextRun.getMonth() + 3);
            break;
          case 'YEARLY':
            nextRun.setFullYear(nextRun.getFullYear() + 1);
            break;
          case 'ONCE':
            nextRun = null;
            break;
           default:
             // Handle unexpected frequency, maybe log an error or skip
             console.warn(`[CHECK_SCHEDULED_REPORTS_WARN] Unknown frequency for report ${report.id}: ${report.frequency}`);
             continue; // Skip this report
        }

        await db.scheduledReport.update({
          where: { id: report.id },
          data: {
            lastRun: now,
            nextRun: nextRun,
            isActive: report.frequency !== 'ONCE'
          }
        });

        // Implement actual report generation logic here
        // For now, just logging a placeholder
        console.log(`[CHECK_SCHEDULED_REPORTS] Generating report "${report.name}" (${report.id})...`);
        // await generateReport(report); // Placeholder for actual report generation

        await notifyUsersByRole({
          role: 'ADMIN',
          title: `Scheduled Report Generated`,
          message: `The scheduled report "${report.name}" has been generated.`,
          type: NotificationType.SYSTEM,
          entityType: 'report',
          entityId: report.id
        });

        await notifyUsersByRole({
          role: 'MANAGER',
          title: `Scheduled Report Generated`,
          message: `The scheduled report "${report.name}" has been generated.`,
          type: NotificationType.SYSTEM, // FIXED: Completed the type
          entityType: 'report',
          entityId: report.id
        });

        await logEvent({
          action: 'GENERATE_SCHEDULED_REPORT',
          entityType: 'report',
          entityId: report.id,
          details: `Scheduled report "${report.name}" generated. Next run: ${nextRun?.toISOString() || 'N/A'}`,
          severity: 'INFO',
          userId: 'system' // Assuming cron jobs run under a 'system' user
        });

      } catch (reportError) {
        console.error(`[CHECK_SCHEDULED_REPORTS_ITEM_ERROR] Failed to process report ${report.id}:`, reportError);
         // Log error for individual report failure
         await logEvent({
           action: 'GENERATE_SCHEDULED_REPORT_ERROR',
           entityType: 'report',
           entityId: report.id,
           details: `Failed to generate scheduled report "${report.name}": ${(reportError as Error).message}`,
           severity: 'ERROR',
           userId: 'system'
         });
      }
    }

    await logEvent({
      action: 'CHECK_SCHEDULED_REPORTS_COMPLETED',
      entityType: 'system',
      details: `Completed scheduled reports check. ${reportsToRun.length} reports processed.`,
      severity: 'INFO',
      userId: 'system'
    });


    return { success: true, reportsProcessed: reportsToRun.length };

  } catch (error) {
    console.error('[CHECK_SCHEDULED_REPORTS_ERROR]', error);

    await logEvent({
      action: 'CHECK_SCHEDULED_REPORTS_ERROR',
      entityType: 'system',
      details: `Failed during scheduled reports check: ${(error as Error).message}`,
      severity: 'ERROR',
      userId: 'system'
    });

    throw error;
  }
}