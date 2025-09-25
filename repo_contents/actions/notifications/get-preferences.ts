// Path: actions/notifications/get-preferences.ts
"use server";

// !!! PROVERITE DA JE OVAJ IMPORT ISPRAVAN i da fajl /lib/db.ts postoji i izvozi 'db' !!!
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { NotificationPreferences } from "@/lib/types/notification-types"; // Updated type
import { UserRole } from "@prisma/client";

/**
 * Fetches user notification preferences or returns default if not found.
 * @param userId - The ID of the user.
 * @returns A promise resolving to NotificationPreferences object or an error.
 */
export async function getUserNotificationPreferences(userId: string): Promise<NotificationPreferences | { error: string }> {
    try {
        const session = await auth();
        if (!session || session.user?.id !== userId) {
             return { error: "Unauthorized" };
        }

        // !!! OVO JE LINIJA GDE PUCANJE ZBOG UNDEFINED 'db' UKAZUJE NA PROBLEM SA /lib/db.ts ILI IMPORTOM !!!
        // Ako je import iznad ispravan, onda je problem u samom /lib/db.ts fajlu
        const preferencesFromDb = await db.notificationPreference.findUnique({
             where: { userId: userId },
             select: { preferences: true } // Selektuj samo JSON polje
        });

        // Definisanje podrazumevanih podešavanja (mora da odgovara strukturi NotificationPreferences interfejsa)
        const defaultNotificationPreferences: NotificationPreferences = {
            userId: userId,
            contractExpiring: { inApp: true, email: false },
            contractRenewalStatusChange: { inApp: true, email: false },
            complaintAssigned: { inApp: true, email: false },
            complaintUpdated: { inApp: true, email: false },
            reminder: { inApp: true, email: false },
            system: { inApp: true, email: false },
            emailNotifications: true,
            inAppNotifications: true,
        };


        // LOGIKA: Ako podešavanja nisu nađena u bazi, vrati podrazumevana
        if (!preferencesFromDb) {
            console.log(`No notification preferences found for user ${userId}. Returning defaults.`);
            return defaultNotificationPreferences;
        }

        // LOGIKA: Ako su podešavanja nađena, vrati ih, ali osiguraj da odgovaraju strukturi
        const storedPrefs = preferencesFromDb.preferences as any; // Prisma čita JSON kao any ili JsonValue

        const mergedPreferences: NotificationPreferences = {
             ...defaultNotificationPreferences,
             ...(storedPrefs || {}),
             userId: userId,
             contractExpiring: { ...defaultNotificationPreferences.contractExpiring, ...(storedPrefs?.contractExpiring || {}) },
             contractRenewalStatusChange: { ...defaultNotificationPreferences.contractRenewalStatusChange, ...(storedPrefs?.contractRenewalStatusChange || {}) },
             complaintAssigned: { ...defaultNotificationPreferences.complaintAssigned, ...(storedPrefs?.complaintAssigned || {}) },
             complaintUpdated: { ...defaultNotificationPreferences.complaintUpdated, ...(storedPrefs?.complaintUpdated || {}) },
             reminder: { ...defaultNotificationPreferences.reminder, ...(storedPrefs?.reminder || {}) },
             system: { ...defaultNotificationPreferences.system, ...(storedPrefs?.system || {}) },
        };

        return mergedPreferences;

    } catch (error) {
        console.error("Error fetching user notification preferences:", error);
        // Vrati objekat sa greškom, kao što očekuje page komponenta
        return { error: "Failed to fetch preferences." };
    }
}
