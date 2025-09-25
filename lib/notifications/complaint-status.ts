// /lib/notifications/complaint-status.ts
import { Complaint, User, NotificationType, Prisma, PrismaClient } from '@prisma/client';
import { ComplaintWithRelations } from '@/lib/types/complaint-types';

type NotificationOptions = {
  includeInternal?: boolean; // Whether to notify internal users
  includeCustomer?: boolean; // Whether to notify customer
  message?: string; // Custom message
};

/**
 * Create status change notifications for relevant users
 */
export async function createStatusChangeNotification(
  complaint: ComplaintWithRelations,
  previousStatus: string | null,
  newStatus: string,
  changedBy: User,
  db: PrismaClient,
  options: NotificationOptions = { includeInternal: true, includeCustomer: true }
): Promise<void> {
  // Default message if not provided
  const message = options.message || 
    `Complaint "${complaint.title}" status changed from ${previousStatus || 'NEW'} to ${newStatus} by ${changedBy.name || changedBy.email}`;
  
  const usersToNotify: string[] = [];
  
  // Always notify the complaint submitter if different from who changed it
  if (complaint.submittedById !== changedBy.id) {
    usersToNotify.push(complaint.submittedById);
  }
  
  // Notify assigned agent if different from who changed it and submitter
  if (complaint.assignedAgentId && 
      complaint.assignedAgentId !== changedBy.id &&
      complaint.assignedAgentId !== complaint.submittedById) {
    usersToNotify.push(complaint.assignedAgentId);
  }
  
  // If there are managers or admins who should be notified for certain statuses
  if (options.includeInternal && 
      (newStatus === 'RESOLVED' || newStatus === 'REJECTED')) {
    // Find managers/admins who should be notified
    const managers = await db.user.findMany({
      where: {
        role: { in: ['ADMIN', 'MANAGER'] },
        isActive: true,
        id: { notIn: [...usersToNotify, changedBy.id] }
      },
      select: { id: true }
    });
    
    managers.forEach(manager => usersToNotify.push(manager.id));
  }
  
  // Create notifications for all identified users
  if (usersToNotify.length > 0) {
    await db.notification.createMany({
      data: usersToNotify.map(userId => ({
        title: `Complaint Status Update: ${newStatus}`,
        message: message,
        type: NotificationType.COMPLAINT_UPDATED,
        userId: userId,
        entityType: 'complaint',
        entityId: complaint.id,
      }))
    });
  }
}

/**
 * Create assignment notification for the assigned agent
 */
export async function createAssignmentNotification(
  complaint: Complaint,
  assignedTo: User,
  assignedBy: User,
  db: PrismaClient
): Promise<void> {
  // Don't notify self-assignments
  if (assignedTo.id === assignedBy.id) {
    return;
  }
  
  await db.notification.create({
    data: {
      title: 'New Complaint Assignment',
      message: `Complaint "${complaint.title}" has been assigned to you by ${assignedBy.name || assignedBy.email}`,
      type: NotificationType.COMPLAINT_ASSIGNED,
      userId: assignedTo.id,
      entityType: 'complaint',
      entityId: complaint.id,
    }
  });
}

/**
 * Create comment notification for relevant users
 */
export async function createCommentNotification(
  complaint: ComplaintWithRelations,
  commentText: string,
  commentBy: User,
  isInternal: boolean,
  db: PrismaClient
): Promise<void> {
  const usersToNotify: string[] = [];
  
  // Notify the complaint submitter if different from commenter and comment is not internal
  if (!isInternal && complaint.submittedById !== commentBy.id) {
    usersToNotify.push(complaint.submittedById);
  }
  
  // Notify assigned agent if different from commenter
  if (complaint.assignedAgentId && complaint.assignedAgentId !== commentBy.id) {
    usersToNotify.push(complaint.assignedAgentId);
  }
  
  // For internal comments, notify managers/admins
  if (isInternal) {
    const managers = await db.user.findMany({
      where: {
        role: { in: ['ADMIN', 'MANAGER'] },
        isActive: true,
        id: { notIn: [...usersToNotify, commentBy.id] }
      },
      select: { id: true }
    });
    
    managers.forEach(manager => usersToNotify.push(manager.id));
  }
  
  // Create notifications
  if (usersToNotify.length > 0) {
    const commentPreview = commentText.length > 100 
      ? `${commentText.substring(0, 100)}...` 
      : commentText;
      
    await db.notification.createMany({
      data: usersToNotify.map(userId => ({
        title: `New ${isInternal ? 'Internal ' : ''}Comment on Complaint`,
        message: `${commentBy.name || commentBy.email} commented on "${complaint.title}": "${commentPreview}"`,
        type: NotificationType.COMPLAINT_UPDATED,
        userId: userId,
        entityType: 'complaint',
        entityId: complaint.id,
      }))
    });
  }
}

/**
 * Mark complaint-related notifications as read
 */
export async function markComplaintNotificationsAsRead(
  complaintId: string,
  userId: string,
  db: PrismaClient
): Promise<void> {
  await db.notification.updateMany({
    where: {
      entityType: 'complaint',
      entityId: complaintId,
      userId: userId,
      isRead: false
    },
    data: {
      isRead: true
    }
  });
}

/**
 * Get unread notifications count for user
 */
export async function getUnreadNotificationsCount(
  userId: string,
  db: PrismaClient
): Promise<number> {
  return await db.notification.count({
    where: {
      userId: userId,
      isRead: false
    }
  });
}