// Path: actions/notifications/update-preferences.ts
"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db"; // Proverite da je import ispravan i da /lib/db.ts radi
import { revalidatePath } from "next/cache";
import { NotificationPreferences, NotificationType } from "@/lib/types/notification-types";

// Schema koja odgovara NotificationPreferences interfejsu
const NotificationPreferencesSchema = z.object({
    userId: z.string(),
    contractExpiring: z.object({ inApp: z.boolean(), email: z.boolean() }),
    contractRenewalStatusChange: z.object({ inApp: z.boolean(), email: z.boolean() }),
    complaintAssigned: z.object({ inApp: z.boolean(), email: z.boolean() }),
    complaintUpdated: z.object({ inApp: z.boolean(), email: z.boolean() }),
    reminder: z.object({ inApp: z.boolean(), email: z.boolean() }),
    system: z.object({ inApp: z.boolean(), email: z.boolean() }),
    emailNotifications: z.boolean(),
    inAppNotifications: z.boolean(),
});

export type NotificationPreferencesInput = z.infer<typeof NotificationPreferencesSchema>;

export async function updateNotificationPreferences(data: NotificationPreferencesInput): Promise<{ success: string; preferences?: NotificationPreferencesInput } | { error: string; details?: any }> {
  try {
    const validatedData = NotificationPreferencesSchema.parse(data);

    const session = await auth();
    if (!session?.user?.id || session.user.id !== validatedData.userId) {
      return { error: "Unauthorized" };
    }

    const userId = session.user.id;

    // !!! OVO JE DEO KOJI MORATE DA OTKOMENTARIŠETE I ISPRAVNO IMPLEMENTIRATE !!!
    // !!! TRENUTNO SE PODACI NE ČUVAJU U BAZI JER JE OVAJ DEO ZAKOMENTARISAN ILI NIJE ISPRAVAN !!!

    // PRILAGODITE OVO VAŠOJ STVARNOJ PRISMA ŠEMI ZA NotificationPreference
    // Ako koristite JSON polje 'preferences' na NotificationPreference modelu:
    await db.notificationPreference.upsert({
       where: { userId: userId }, // Pronađi po userId
       create: {
         userId: userId,
         preferences: validatedData as any, // Sačuvaj ceo objekat kao JSON (možda treba as any)
       },
       update: {
         preferences: validatedData as any, // Ažuriraj JSON polje (možda treba as any)
       },
    });

    // ILI ako koristite posebnu NotificationPreference tabelu sa kolonama za svaki tip/metod:
    /*
     await db.notificationPreference.upsert({
       where: {
         userId,
       },
       create: {
         userId,
         // Map validatedData fields to database columns
         contractExpiringInApp: validatedData.contractExpiring.inApp,
         contractExpiringEmail: validatedData.contractExpiring.email,
         contractRenewalStatusChangeInApp: validatedData.contractRenewalStatusChange.inApp,
         contractRenewalStatusChangeEmail: validatedData.contractRenewalStatusChange.email,
         complaintAssignedInApp: validatedData.complaintAssigned.inApp,
         complaintAssignedEmail: validatedData.complaintAssigned.email,
         complaintUpdatedInApp: validatedData.complaintUpdated.inApp,
         complaintUpdatedEmail: validatedData.complaintUpdated.email,
         reminderInApp: validatedData.reminder.inApp,
         reminderEmail: validatedData.reminder.email,
         systemInApp: validatedData.system.inApp,
         systemEmail: validatedData.system.email,
         generalEmailEnabled: validatedData.emailNotifications,
         generalInAppEnabled: validatedData.inAppNotifications,
       },
       update: {
         // Map validatedData fields to database columns
         contractExpiringInApp: validatedData.contractExpiring.inApp,
         contractExpiringEmail: validatedData.contractExpiring.email,
         contractRenewalStatusChangeInApp: validatedData.contractRenewalStatusChange.inApp,
         contractRenewalStatusChangeEmail: validatedData.contractRenewalStatusChange.email,
         complaintAssignedInApp: validatedData.complaintAssigned.inApp,
         complaintAssignedEmail: validatedData.complaintAssigned.email,
         complaintUpdatedInApp: validatedData.complaintUpdated.inApp,
         complaintUpdatedEmail: validatedData.complaintUpdated.email,
         reminderInApp: validatedData.reminder.inApp,
         reminderEmail: validatedData.reminder.email,
         systemInApp: validatedData.system.inApp,
         systemEmail: validatedData.system.email,
         generalEmailEnabled: validatedData.emailNotifications,
         generalInAppEnabled: validatedData.inAppNotifications,
       },
     });
    */


    // Create an activity log (ovo već imate i ispravno je)
    await db.activityLog.create({
      data: {
        action: "UPDATE_NOTIFICATION_PREFERENCES",
        entityType: "USER",
        entityId: userId,
        details: JSON.stringify(validatedData),
        severity: "INFO",
        userId: userId,
      },
    });

    // Revalidate the notification settings page path (ovo već imate i ispravno je)
    revalidatePath("/notifications/settings");

    return {
      success: "Notification preferences updated",
      preferences: validatedData // Vrati validatedData nazad klijentu
    };
  } catch (error: any) {
    if (error && typeof error === 'object' && error.name === 'ZodError') {
       console.error("Zod Validation Error:", error.errors);
       return { error: "Invalid preference data", details: error.errors };
    }

    console.error("Failed to update notification preferences:", error);
    return { error: "Failed to update notification preferences" };
  }
}
