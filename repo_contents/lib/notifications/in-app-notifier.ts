// Path: lib/notifications/in-app-notifier.ts

import { Notification, NotificationType as PrismaNotificationType, User } from '@prisma/client';
import { db } from '@/lib/db'; // Assuming your Prisma client instance
import { pusherServer } from '@/lib/pusher'; // Assuming your Pusher server instance
import { logEvent } from '@/actions/security/log-event'; // Assuming a logging action
import { sendNotificationEmail } from './email-sender'; // Assuming an email sending function
// Import the action to get user preferences and the NotificationPreferences type
import { getUserNotificationPreferences } from '@/actions/notifications/get-preferences';
import { NotificationPreferences, NotificationType } from '@/lib/types/notification-types';


/**
 * Create a notification in the database and trigger delivery based on user preferences.
 * This function now fetches user preferences internally to decide delivery channels.
 */
export async function createNotification({
  userId,
  title,
  message,
  type,
  entityType,
  entityId,
}: {
  userId: string;
  title: string;
  message: string;
  type: NotificationType; // Use your refined NotificationType from types file
  entityType?: string;
  entityId?: string;
}): Promise<Notification | null> { // Return Notification or null if no channels are enabled
  try {
    // 1. Pribavi podešavanja notifikacija za korisnika
    const userPreferencesResult = await getUserNotificationPreferences(userId);

    let sendInApp = true; // Podrazumevano (ako ne možemo da pribavimo podešavanja)
    let sendEmail = false; // Podrazumevano (ako ne možemo da pribavimo podešavanja)

    if (userPreferencesResult && !('error' in userPreferencesResult)) {
        const prefs = userPreferencesResult;

        // Odredi da li poslati na osnovu tipa notifikacije i korisničkih preferenci
        switch (type) {
            case "CONTRACT_EXPIRING":
                sendInApp = prefs.contractExpiring.inApp;
                sendEmail = prefs.contractExpiring.email;
                break;
            case "CONTRACT_RENEWAL_STATUS_CHANGE":
                sendInApp = prefs.contractRenewalStatusChange.inApp;
                sendEmail = prefs.contractRenewalStatusChange.email;
                break;
            case "COMPLAINT_ASSIGNED":
                sendInApp = prefs.complaintAssigned.inApp;
                sendEmail = prefs.complaintAssigned.email;
                break;
            case "COMPLAINT_UPDATED":
                sendInApp = prefs.complaintUpdated.inApp;
                sendEmail = prefs.complaintUpdated.email;
                break;
            case "REMINDER":
                sendInApp = prefs.reminder.inApp;
                sendEmail = prefs.reminder.email;
                break;
            case "SYSTEM":
                sendInApp = prefs.system.inApp;
                sendEmail = prefs.system.email;
                break;
            default:
                // Ako tip notifikacije nije eksplicitno definisan u preferencama,
                // koristi opšta podešavanja (ako postoje) ili podrazumevane vrednosti.
                // Vaš NotificationPreferences interfejs ima i opšta polja.
                sendInApp = prefs.inAppNotifications;
                sendEmail = prefs.emailNotifications;
                break;
        }

        // Dodatna provera sa opštim 'enabled' flagovima ako postoje u vašem interfejsu
        // (prema vašem NotificationPreferences tipu, oni postoje)
        sendInApp = sendInApp && prefs.inAppNotifications;
        sendEmail = sendEmail && prefs.emailNotifications;

    } else {
         console.warn(`Could not fetch preferences for user ${userId}. Sending with default channel settings.`);
         // U slučaju greške pri pribavljanju preferenci, možete odlučiti da li
         // poslati podrazumevano (true, true) ili ne poslati ništa (false, false).
         // Trenutno ostaje podrazumevano true, true.
    }

    // Ako nijedan kanal nije omogućen za ovog korisnika i ovaj tip notifikacije, ne radi ništa
    if (!sendInApp && !sendEmail) {
        console.log(`Notification type ${type} disabled for user ${userId}. Skipping delivery.`);
        return null; // Vrati null jer notifikacija nije poslata
    }

    // 2. Kreiraj zapis notifikacije u bazi (ovo je za in-app listu, kreira se uvek ako je in-app enabled)
    let notificationRecord: Notification | null = null;
    if (sendInApp) {
         notificationRecord = await db.notification.create({
           data: {
             userId,
             title,
             message,
             // Koristimo PrismaNotificationType jer db.notification model koristi enum iz Prisma klijenta
             type: type as PrismaNotificationType,
             entityType,
             entityId,
             isRead: false,
           }
         });
    }


    // 3. Uslovno pošalji Push/In-App ako je omogućeno
    // Šaljemo push samo ako je in-app omogućen I ako smo uspešno kreirali zapis u bazi
    if (sendInApp && notificationRecord) {
      await sendPushNotification(userId, notificationRecord);
    }

    // 4. Uslovno pošalji Email ako je omogućeno
    if (sendEmail) {
       // sendNotificationEmail verovatno očekuje Notification objekat.
       // Ako je sendInApp bio false, notificationRecord će biti null.
       // Možete kreirati privremeni objekat ili prilagoditi sendNotificationEmail
       // da prima samo potrebne podatke umesto celog Notification modela.
       // Za sada, prosleđujemo notificationRecord (može biti null ako sendInApp=false)
       // ili možete kreirati minimalni objekat ako je null.
       // Primer:
       const notificationDataForEmail = notificationRecord || {
           id: 'temp-' + Date.now(), // Privremeni ID ako nema DB zapisa
           userId, title, message, type: type as PrismaNotificationType,
           entityType, entityId, isRead: false, createdAt: new Date()
       };
       await sendNotificationEmail(notificationDataForEmail as Notification); // Možda treba cast
    }

    // Logovanje uspešnog slanja (ako je bar jedan kanal bio omogućen)
     await logEvent({
       action: 'SEND_NOTIFICATION',
       entityType: 'notification',
       entityId: notificationRecord?.id || 'N/A', // Koristi ID DB zapisa ako postoji
       details: `Notification sent to user ${userId} (Type: ${type}, Channels: ${sendInApp ? 'In-App' : ''}${sendInApp && sendEmail ? ', ' : ''}${sendEmail ? 'Email' : ''})`,
       severity: 'INFO',
       userId: 'system'
     });


    return notificationRecord; // Vrati kreirani DB zapis (ili null ako in-app nije bio omogućen)

  } catch (error) {
    console.error('[CREATE_NOTIFICATION_ERROR]', error);

    await logEvent({
      action: 'CREATE_NOTIFICATION_ERROR',
      entityType: 'notification',
      entityId: 'N/A',
      details: `Failed to process notification for user ${userId}: ${(error as Error).message}`,
      severity: 'ERROR',
      userId: 'system'
    });

    // Ne bacaj grešku dalje ako je samo slanje jednog kanala propalo,
    // ali bacaj ako je problem sa čitanjem preferenci ili kreiranjem DB zapisa (ako je in-app enabled).
    // Za sada, bacamo grešku ako bilo šta unutar try bloka ne uspe.
    throw error;
  }
}

/**
 * Send a real-time push notification to a user via Pusher.
 * (This function remains largely the same, it just sends the push)
 */
export async function sendPushNotification(userId: string, notification: Notification) {
  try {
    await pusherServer.trigger(
      `user-${userId}-notifications`,
      'new-notification',
      {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type, // Ovo je Prisma enum
        entityType: notification.entityType,
        entityId: notification.entityId,
        createdAt: notification.createdAt
      }
    );

    return { success: true };
  } catch (error) {
    console.error('[PUSH_NOTIFICATION_ERROR]', error);

    await logEvent({
      action: 'PUSH_NOTIFICATION_ERROR',
      entityType: 'notification',
      entityId: notification.id,
      details: `Failed to send push notification: ${(error as Error).message}`,
      severity: 'ERROR',
      userId: 'system'
    });

    return { success: false, error };
  }
}

// Note: sendNotificationEmail function (imported from ./email-sender)
// should also handle receiving a Notification object or similar data structure.

/**
 * Mark a specific notification as read for a given user.
 * (This function remains the same)
 */
export async function markNotificationAsRead(notificationId: string, userId: string) {
  try {
    const notification = await db.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      throw new Error(`Notification with ID ${notificationId} not found`);
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true }
    });

    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    if (notification.userId !== userId && user.role !== 'ADMIN') {
      throw new Error('Unauthorized to mark this notification as read');
    }

    const updatedNotification = await db.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });

    return updatedNotification;
  } catch (error) {
    console.error('[MARK_NOTIFICATION_READ_ERROR]', error);
    throw error;
  }
}

/**
 * Create notifications for a list of user IDs based on their preferences.
 * Calls createNotification for each user without passing sendEmail/sendPush flags.
 */
export async function createBulkNotifications({
  userIds,
  title,
  message,
  type,
  entityType,
  entityId,
}: {
  userIds: string[];
  title: string;
  message: string;
  type: NotificationType; // Use your refined NotificationType
  entityType?: string;
  entityId?: string;
}) {
  const notifications = [];

  for (const userId of userIds) {
    try {
       // !!! KORIGOVANO: Pozovi createNotification bez sendEmail/sendPush flagova !!!
      const notification = await createNotification({
        userId,
        title,
        message,
        type,
        entityType,
        entityId,
      });

      // Dodaj notifikaciju samo ako je kreirana (tj. ako je bar jedan kanal bio omogućen)
      if (notification) {
         notifications.push(notification);
      }

    } catch (error) {
      console.error(`Failed to process notification for user ${userId}:`, error);
      // Nastavi na sledećeg korisnika čak i ako jedan ne uspe
    }
  }

  return notifications; // Vrati listu uspešno kreiranih (in-app enabled) notifikacija
}

/**
 * Create notifications for all active users with a specific role based on their preferences.
 * Fetches user IDs by role and then calls createBulkNotifications.
 */
export async function notifyUsersByRole({
  role,
  title,
  message,
  type,
  entityType,
  entityId,
}: {
  role: 'ADMIN' | 'MANAGER' | 'AGENT' | 'USER';
  title: string;
  message: string;
  type: NotificationType; // Use your refined NotificationType
  entityType?: string;
  entityId?: string;
}) {
  try {
    // Get all active users with the specified role
    const users = await db.user.findMany({
      where: {
        role,
        isActive: true
      },
      select: {
        id: true
      }
    });

    const userIds = users.map(user => user.id);

    // Ako nema korisnika sa tom ulogom, ne radi ništa
    if (userIds.length === 0) {
        console.log(`No active users found with role ${role} to notify.`);
        return [];
    }

    // !!! KORIGOVANO: Pozovi createBulkNotifications bez sendEmail/sendPush flagova !!!
    return await createBulkNotifications({
      userIds,
      title,
      message,
      type,
      entityType,
      entityId,
    });
  } catch (error) {
    console.error('[NOTIFY_ROLE_ERROR]', error);
    throw error;
  }
}
