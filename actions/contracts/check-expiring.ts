// actions/contracts/check-expiring.ts
'use server';

import { db } from '@/lib/db';
import { addDays, startOfDay, endOfDay } from 'date-fns';
import { sendContractExpirationNotification } from '@/lib/contracts/notification-sender';
import { auth } from '@/auth';

export const checkExpiringContracts = async (daysThreshold: number = 30) => {
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
      const existingExpirationReminder = contract.reminders.find(r => r.reminderType === 'expiration');

      if (!existingExpirationReminder) {
        const newReminder = await db.contractReminder.create({
          data: {
            contractId: contract.id,
            reminderDate: contract.endDate,
            reminderType: 'expiration',
          }
        });

        remindersCreatedCount++;
        createdReminderIds.push(newReminder.id);

        if (contract.createdBy?.email && contract.createdBy?.id) {
          // Ispravan poziv sa 4 argumenta
          await sendContractExpirationNotification(
            contract,
            contract.createdBy.id,              // ← user ID (obavezan 2. arg)
            contract.createdBy.email,           // ← email (3. arg)
            daysThreshold                       // ← daysLeft (4. arg)
          );
          notificationsSentCount++;
        } else {
          console.warn(`No creator email or ID found for contract ${contract.contractNumber}`);
        }
      } else {
        console.log(`Reminder for contract ${contract.contractNumber} already exists.`);
      }
    }

    return {
      success: true,
      message: `Provera isteka završena. Pronađeno ${expiringContracts.length} ugovora koji ističu. Kreirano ${remindersCreatedCount} podsetnika i poslato ${notificationsSentCount} notifikacija.`,
      expiringContractIds: expiringContracts.map(c => c.id),
      createdReminderIds,
    };
  } catch (error) {
    console.error("Greška pri proveri ugovora koji ističu:", error);
    return { error: "Neuspešna provera ugovora koji ističu." };
  }
};