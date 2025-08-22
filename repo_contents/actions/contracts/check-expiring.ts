// /actions/contracts/check-expiring.ts
'use server';

import { db } from '@/lib/db';
import { addDays, startOfDay, endOfDay } from 'date-fns';
import { sendContractExpirationNotification } from '@/lib/contracts/notification-sender';
import { auth } from '@/auth'; // Pretpostavljena putanja do vašeg auth helpera

/**
 * Proverava ugovore kojima ističe rok u narednom broju dana i kreira podsetnike/notifikacije.
 * Može se pokrenuti manuelno ili kroz zakazani task.
 * @param daysThreshold - Broj dana unutar kojih se ugovori smatraju "uskoro ističu". Podrazumevano 30.
 * @returns Objekat sa informacijama o rezultatu provere.
 */
export const checkExpiringContracts = async (daysThreshold: number = 30) => {
  // Opciono: Provera autorizacije ako ovu akciju mogu pokrenuti samo određeni korisnici
   const session = await auth();
   if (!session?.user) {
     return { error: "Unauthorized" };
   }

  try {
    const today = startOfDay(new Date());
    const expiryDateThreshold = endOfDay(addDays(today, daysThreshold));

    const expiringContracts = await db.contract.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          gte: today,
          lte: expiryDateThreshold,
        },
      },
      include: {
        reminders: {
          where: {
            reminderType: 'expiration',
          }
        },
        createdBy: {
          select: { id: true, email: true, name: true }
        }
      },
    });

    let remindersCreatedCount = 0;
    let notificationsSentCount = 0;
    const createdReminderIds = [];

    for (const contract of expiringContracts) {
        // Provera da li već postoji podsetnik za istek za ovaj ugovor
        // Ovo je osnovna provera, može se unaprediti
        const existingExpirationReminder = contract.reminders.find(r => r.reminderType === 'expiration');

        if (!existingExpirationReminder) {
            // Kreiranje novog podsetnika u bazi
            const newReminder = await db.contractReminder.create({
                data: {
                    contractId: contract.id,
                    reminderDate: contract.endDate, // Datum podsetnika je datum isteka
                    reminderType: 'expiration', // Tip podsetnika
                    // isAcknowledged će biti false po defaultu
                }
            });
            remindersCreatedCount++;
            createdReminderIds.push(newReminder.id);

            // Slanje notifikacije (npr. kreatoru ugovora ili odgovornoj osobi)
            // Ova funkcija (koju ćemo kreirati kasnije) može poslati email, in-app notifikaciju, itd.
            if (contract.createdBy?.email) {
                 await sendContractExpirationNotification(contract, contract.createdBy.email, daysThreshold);
                 notificationsSentCount++;
            } else {
                console.warn(`No creator email found for contract ${contract.contractNumber} to send notification.`);
            }

        } else {
            console.log(`Reminder for contract ${contract.contractNumber} already exists.`);
             // Opciono: Možete ažurirati postojeći podsetnik ili notifikaciju ako je potrebno
        }
    }

    return {
      success: true,
      message: `Expiration check completed. Found ${expiringContracts.length} expiring contracts. Created ${remindersCreatedCount} reminders and sent ${notificationsSentCount} notifications.`,
      expiringContractIds: expiringContracts.map(c => c.id),
      createdReminderIds: createdReminderIds,
    };

  } catch (error) {
    console.error("Error checking expiring contracts:", error);
    return { error: "Failed to check expiring contracts." };
  }
};