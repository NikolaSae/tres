// /lib/notifications/anomaly-alert.ts
import { NotificationType, PrismaClient, UserRole } from '@prisma/client';
import { AnomalyDetectionResult } from '@/utils/anomaly-detection';

/**
 * Create notifications for detected anomalies in complaint patterns
 */
export async function createAnomalyAlerts(
  anomaly: AnomalyDetectionResult,
  relatedEntityId: string | null,
  db: PrismaClient
): Promise<void> {
  // Only create alerts for actual detected anomalies
  if (!anomaly.detected) {
    return;
  }
  
  // Find users who should receive anomaly alerts (admins and managers)
  const targetUsers = await db.user.findMany({
    where: {
      role: { in: [UserRole.ADMIN, UserRole.MANAGER] },
      isActive: true
    },
    select: { id: true }
  });
  
  if (targetUsers.length === 0) {
    return;
  }
  
  // Create appropriate title based on severity
  let title = 'Complaint Pattern Alert';
  if (anomaly.severity === 'high') {
    title = '⚠️ URGENT: Critical Complaint Pattern Detected';
  } else if (anomaly.severity === 'medium') {
    title = '⚠️ Warning: Unusual Complaint Pattern Detected';
  }
  
  // Create notifications for all managers/admins
  await db.notification.createMany({
    data: targetUsers.map(user => ({
      title,
      message: anomaly.details,
      type: NotificationType.SYSTEM,
      userId: user.id,
      entityType: relatedEntityId ? 'complaint' : 'system',
      entityId: relatedEntityId || undefined,
    }))
  });
  
  // Log the anomaly in activity log
  await db.activityLog.create({
    data: {
      action: 'ANOMALY_DETECTED',
      entityType: relatedEntityId ? 'complaint' : 'system',
      entityId: relatedEntityId || undefined,
      details: `${anomaly.type.toUpperCase()} ANOMALY: ${anomaly.details}`,
      severity: anomaly.severity === 'high' ? 'CRITICAL' : 
                anomaly.severity === 'medium' ? 'WARNING' : 'INFO',
      userId: targetUsers[0].id, // Use the first admin/manager as the logger
    }
  });
}

/**
 * Check for complaint anomalies and create alerts if detected
 */
export async function detectAndAlertAnomalies(db: PrismaClient): Promise<void> {
  // This would be a scheduled function that runs periodically
  // It would use the anomaly-detection utility to check for patterns
  
  // Here's a simplified implementation:
  
  // 1. Get recent complaints (e.g., last 7 days)
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const recentComplaints = await db.complaint.findMany({
    where: {
      createdAt: { gte: sevenDaysAgo }
    }
  });
  
  // 2. Get historical complaints for comparison (e.g., previous 30 days)
  const thirtySevenDaysAgo = new Date(now.getTime() - 37 * 24 * 60 * 60 * 1000);
  
  const historicalComplaints = await db.complaint.findMany({
    where: {
      createdAt: { 
        gte: thirtySevenDaysAgo,
        lt: sevenDaysAgo
      }
    }
  });
  
  // 3. Use the anomaly detection utility
  // This part would normally import and use the detection utility
  // For this example, we'll just create a mock result
  
  const mockAnomaly: AnomalyDetectionResult = {
    detected: true,
    type: 'volume',
    details: 'Complaint volume increased by 75% compared to historical average',
    severity: 'medium'
  };
  
  // 4. Create alerts if anomalies detected
  if (mockAnomaly.detected) {
    await createAnomalyAlerts(mockAnomaly, null, db);
  }
}