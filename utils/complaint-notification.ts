// utils/complaint-notification.ts
import { ComplaintStatus } from "@/lib/types/enums";
import { ComplaintWithRelations } from "@/lib/types/complaint-types";
import { NotificationType, UserRole } from "@prisma/client"; // ✅ Added UserRole import
import { db } from "@/lib/db";

interface NotificationData {
  title: string;
  message: string;
  type: NotificationType;
  userId?: string;
  roles?: UserRole[]; // ✅ Changed from string[] to UserRole[]
  entityType: string;
  entityId: string;
}

export async function createNotification(data: NotificationData): Promise<void> {
  // Ako su prosleđene role, pronađite korisnike sa tim rolama
  if (data.roles && data.roles.length > 0) {
    const usersToNotify = await db.user.findMany({
      where: {
        role: {
          in: data.roles,
        },
      },
      select: { id: true },
    });

    // Kreirajte notifikaciju za svakog korisnika
    const notificationPromises = usersToNotify.map(user =>
      db.notification.create({
        data: {
          title: data.title,
          message: data.message,
          type: data.type,
          userId: user.id,
          entityType: data.entityType,
          entityId: data.entityId,
        },
      })
    );
    await Promise.all(notificationPromises);

  } else if (data.userId) {
    // Ako je prosleđen samo userId, kreirajte notifikaciju za tog korisnika
    await db.notification.create({
      data: {
        title: data.title,
        message: data.message,
        type: data.type,
        userId: data.userId,
        entityType: data.entityType,
        entityId: data.entityId,
      },
    });
  } else {
    // Ako nije prosleđen ni userId ni roles, logujte upozorenje
    console.warn("createNotification called without userId or roles.");
  }
}

export async function sendComplaintStatusNotification(
  complaint: ComplaintWithRelations,
  previousStatus: ComplaintStatus,
  newStatus: ComplaintStatus,
  userId: string
): Promise<void> {
  // Logika za slanje notifikacije submitteru
  if (complaint.submittedById !== userId) {
    await createNotification({
      title: `Complaint Status Updated`,
      message: `Your complaint "${complaint.title}" has been updated from ${previousStatus} to ${newStatus}`,
      type: NotificationType.COMPLAINT_UPDATED,
      userId: complaint.submittedById,
      entityType: "complaint",
      entityId: complaint.id
    });
  }

  // Logika za slanje notifikacije dodeljenom agentu
  if (complaint.assignedAgentId && complaint.assignedAgentId !== userId) {
    await createNotification({
      title: `Complaint Status Updated`,
      message: `A complaint assigned to you "${complaint.title}" has been updated from ${previousStatus} to ${newStatus}`,
      type: NotificationType.COMPLAINT_UPDATED,
      userId: complaint.assignedAgentId,
      entityType: "complaint",
      entityId: complaint.id
    });
  }
}

export async function sendAssignmentNotification(
  complaint: ComplaintWithRelations,
  assignedAgentId: string,
  userId: string
): Promise<void> {
  // Notify the assigned agent
  if (assignedAgentId !== userId) {
    await createNotification({
      title: "New Complaint Assignment",
      message: `You have been assigned to complaint "${complaint.title}"`,
      type: NotificationType.COMPLAINT_ASSIGNED,
      userId: assignedAgentId,
      entityType: "complaint",
      entityId: complaint.id
    });
  }

  // Notify the submitter
  if (complaint.submittedById !== userId) {
    await createNotification({
      title: "Complaint Assigned",
      message: `Your complaint "${complaint.title}" has been assigned to an agent`,
      type: NotificationType.COMPLAINT_UPDATED,
      userId: complaint.submittedById,
      entityType: "complaint",
      entityId: complaint.id
    });
  }

  // Opciono: Notifikovati admine/menadžere o dodeli
  // await createNotification({
  //   title: "Complaint Assigned",
  //   message: `Complaint "${complaint.title}" has been assigned to ${assignedAgentId}.`,
  //   type: NotificationType.SYSTEM,
  //   roles: [UserRole.ADMIN, UserRole.MANAGER], // ✅ Use UserRole enum
  //   entityType: "complaint",
  //   entityId: complaint.id
  // });
}

export async function sendNewCommentNotification(
  complaint: ComplaintWithRelations,
  commentAuthorId: string,
  isInternal: boolean
): Promise<void> {
  // If it's an internal comment, only notify other agents/admins involved
  if (isInternal) {
    // Notify assigned agent if they're not the comment author
    if (complaint.assignedAgentId && complaint.assignedAgentId !== commentAuthorId) {
      await createNotification({
        title: "New Internal Comment",
        message: `A new internal comment was added to complaint "${complaint.title}"`,
        type: NotificationType.COMPLAINT_UPDATED,
        userId: complaint.assignedAgentId,
        entityType: "complaint",
        entityId: complaint.id
      });
    }
    // Opciono: Notifikovati ostale admine/menadžere
    // await createNotification({
    //   title: "New Internal Comment",
    //   message: `An internal comment was added to complaint "${complaint.title}" by ${commentAuthorId}.`,
    //   type: NotificationType.SYSTEM,
    //   roles: [UserRole.ADMIN, UserRole.MANAGER], // ✅ Use UserRole enum
    //   entityType: "complaint",
    //   entityId: complaint.id
    // });

  } else {
    // For regular comments, notify both the submitter and the assigned agent
    if (complaint.submittedById !== commentAuthorId) {
      await createNotification({
        title: "New Comment",
        message: `A new comment was added to your complaint "${complaint.title}"`,
        type: NotificationType.COMPLAINT_UPDATED,
        userId: complaint.submittedById,
        entityType: "complaint",
        entityId: complaint.id
      });
    }

    if (complaint.assignedAgentId && complaint.assignedAgentId !== commentAuthorId) {
      await createNotification({
        title: "New Comment",
        message: `A new comment was added to complaint "${complaint.title}"`,
        type: NotificationType.COMPLAINT_UPDATED,
        userId: complaint.assignedAgentId,
        entityType: "complaint",
        entityId: complaint.id
      });
    }
  }
}