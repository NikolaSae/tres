// utils/complaint-notification.ts
import { ComplaintStatus } from "@/lib/types/enums"; // Proverite putanju
import { Complaint, ComplaintWithRelations } from "@/lib/types/complaint-types"; // Proverite putanju
import { NotificationType } from "@prisma/client"; // Uvezeno NotificationType iz Prisma klijenta
import { db } from "@/lib/db"; // Proverite putanju za db

interface NotificationData {
  title: string;
  message: string;
  type: NotificationType;
  userId?: string; // userId je opcionalan ako koristite 'roles'
  roles?: string[]; // Dodata opcija za slanje notifikacija po rolama
  entityType: string;
  entityId: string;
}

// ISPRAVLJENO: Dodat export keyword
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


// Ove funkcije su već ispravno eksportovane
export async function sendComplaintStatusNotification(
  complaint: ComplaintWithRelations,
  previousStatus: ComplaintStatus,
  newStatus: ComplaintStatus,
  userId: string // Korisnik koji je promenio status
): Promise<void> {
  // Logika za slanje notifikacije submitteru
  if (complaint.submittedById !== userId) { // Ne šaljemo notifikaciju submitteru ako je on promenio status
    await createNotification({
      title: `Complaint Status Updated`,
      message: `Your complaint "${complaint.title}" has been updated from ${previousStatus} to ${newStatus}`,
      type: NotificationType.COMPLAINT_UPDATED,
      userId: complaint.submittedById,
      entityType: "complaint",
      entityId: complaint.id
    });
  }

  // Logika za slanje notifikacije dodeljenom agentu (ako postoji i nije korisnik koji je promenio status)
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
  assignedAgentId: string, // ID agenta kojem se dodeljuje
  userId: string // Korisnik koji je izvršio dodelu
): Promise<void> {
  // Notify the assigned agent (ako agent nije korisnik koji je izvršio dodelu)
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

  // Notify the submitter that their complaint has been assigned (ako submitter nije korisnik koji je izvršio dodelu)
  if (complaint.submittedById !== userId) {
    await createNotification({
      title: "Complaint Assigned",
      message: `Your complaint "${complaint.title}" has been assigned to an agent`,
      type: NotificationType.COMPLAINT_UPDATED, // Možda COMPLAINT_ASSIGNED? Proverite enum
      userId: complaint.submittedById,
      entityType: "complaint",
      entityId: complaint.id
    });
  }

  // Opciono: Notifikovati admine/menadžere o dodeli
  // await createNotification({
  //   title: "Complaint Assigned",
  //   message: `Complaint "${complaint.title}" has been assigned to ${assignedAgentId}.`,
  //   type: NotificationType.SYSTEM, // Ili drugi odgovarajući tip
  //   roles: ["ADMIN", "MANAGER"],
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
        type: NotificationType.COMPLAINT_UPDATED, // Proverite tip notifikacije
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
    //   roles: ["ADMIN", "MANAGER"], // Slanje notifikacije svim adminima/menadžerima
    //   userId: commentAuthorId, // Izuzimanje autora komentara
    //   entityType: "complaint",
    //   entityId: complaint.id
    // });

  } else {
    // For regular comments, notify both the submitter and the assigned agent
    if (complaint.submittedById !== commentAuthorId) {
      await createNotification({
        title: "New Comment",
        message: `A new comment was added to your complaint "${complaint.title}"`,
        type: NotificationType.COMPLAINT_UPDATED, // Proverite tip notifikacije
        userId: complaint.submittedById,
        entityType: "complaint",
        entityId: complaint.id
      });
    }

    if (complaint.assignedAgentId && complaint.assignedAgentId !== commentAuthorId) {
      await createNotification({
        title: "New Comment",
        message: `A new comment was added to complaint "${complaint.title}"`,
        type: NotificationType.COMPLAINT_UPDATED, // Proverite tip notifikacije
        userId: complaint.assignedAgentId,
        entityType: "complaint",
        entityId: complaint.id
      });
    }
  }
}
