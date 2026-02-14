// /lib/contracts/reminder-scheduler.ts

import { db } from '@/lib/db';
import { ContractReminder, User } from '@prisma/client';
import { sendReminderNotification } from '@/lib/contracts/notification-sender';

// ✅ Tip koji proširuje Reminder sa potrebnim relacijama
interface DueReminder extends ContractReminder {
    acknowledgedBy: User | null;
    contract: { // ✅ Samo jedna definicija contract property-ja
        id: string;
        name: string;
        contractNumber: string;
        createdBy: { 
            id: string; 
            email: string | null; 
            name: string | null; 
        } | null;
    } | null;
}

/**
 * Proverava sve podsetnike koji su dospeli (reminderDate je danas ili prošao)
 * i koji nisu označeni kao pregledani, a zatim pokreće odgovarajuću akciju (npr. slanje notifikacije).
 * Ova funkcija je namenjena pokretanju od strane zakazanog zadatka.
 * @returns Objekat sa brojem obrađenih podsetnika i brojem poslatih notifikacija.
 */
export const processDueReminders = async () => {
    try {
        const now = new Date();

        // 1. Pronalaženje dospelih i nepregledanih podsetnika
        const dueReminders = await db.contractReminder.findMany({
            where: {
                isAcknowledged: false,
                reminderDate: {
                    lte: now,
                },
            },
            include: {
                contract: {
                    select: {
                        id: true,
                        name: true,
                        contractNumber: true,
                        createdBy: {
                            select: { id: true, email: true, name: true }
                        }
                    }
                },
                acknowledgedBy: true, // ✅ Dodaj ovo da bi se tip poklopio
            },
        });

        let processedCount = 0;
        let notificationsSentCount = 0;
        const processedReminderIds: string[] = [];

        console.log(`Found ${dueReminders.length} due reminders to process.`);

        // 2. Obrada svakog dospelog podsetnika
        for (const reminder of dueReminders) {
            if (!reminder.contract) {
                console.warn(`Due reminder ${reminder.id} is linked to a non-existent contract.`);
                continue;
            }

            try {
                // Triggerovanje akcije na osnovu tipa podsetnika
                switch (reminder.reminderType) {
                    case 'expiration':
                        console.log(`Processing expiration reminder for contract ${reminder.contract.contractNumber}`);
                        
                        if (reminder.contract.createdBy?.id && reminder.contract.createdBy?.email) {
                            await sendReminderNotification(
                                {
                                    id: reminder.id,
                                    reminderDate: reminder.reminderDate,
                                    reminderType: reminder.reminderType,
                                    contract: {
                                        id: reminder.contract.id,
                                        name: reminder.contract.name,
                                        contractNumber: reminder.contract.contractNumber,
                                    }
                                },
                                reminder.contract.createdBy.id, // ✅ userId umesto email
                                reminder.contract.createdBy.email, // ✅ email kao drugi parametar
                                `Contract "${reminder.contract.name}" is expiring on ${reminder.reminderDate.toDateString()}`
                            );
                            notificationsSentCount++;
                        } else {
                            console.warn(`No creator email found for contract ${reminder.contract.contractNumber} for expiration reminder.`);
                        }
                        break;

                    case 'renewal':
                        console.log(`Processing renewal reminder for contract ${reminder.contract.contractNumber}`);
                        
                        if (reminder.contract.createdBy?.id && reminder.contract.createdBy?.email) {
                            await sendReminderNotification(
                                {
                                    id: reminder.id,
                                    reminderDate: reminder.reminderDate,
                                    reminderType: reminder.reminderType,
                                    contract: {
                                        id: reminder.contract.id,
                                        name: reminder.contract.name,
                                        contractNumber: reminder.contract.contractNumber,
                                    }
                                },
                                reminder.contract.createdBy.id,
                                reminder.contract.createdBy.email,
                                `Contract "${reminder.contract.name}" renewal reminder.`
                            );
                            notificationsSentCount++;
                        } else {
                            console.warn(`No recipient email found for contract ${reminder.contract.contractNumber} for renewal reminder.`);
                        }
                        break;

                    case 'review':
                        console.log(`Processing review reminder for contract ${reminder.contract.contractNumber}`);
                        
                        if (reminder.contract.createdBy?.id && reminder.contract.createdBy?.email) {
                            await sendReminderNotification(
                                {
                                    id: reminder.id,
                                    reminderDate: reminder.reminderDate,
                                    reminderType: reminder.reminderType,
                                    contract: {
                                        id: reminder.contract.id,
                                        name: reminder.contract.name,
                                        contractNumber: reminder.contract.contractNumber,
                                    }
                                },
                                reminder.contract.createdBy.id,
                                reminder.contract.createdBy.email,
                                `Contract "${reminder.contract.name}" requires review.`
                            );
                            notificationsSentCount++;
                        } else {
                            console.warn(`No recipient email found for contract ${reminder.contract.contractNumber} for review reminder.`);
                        }
                        break;

                    default:
                        console.warn(`Unknown reminder type for reminder ${reminder.id}: ${reminder.reminderType}`);
                        break;
                }

                processedCount++;
                processedReminderIds.push(reminder.id);

            } catch (processingError) {
                console.error(`Error processing reminder ${reminder.id}:`, processingError);
            }
        }

        console.log(`Finished processing due reminders. Processed ${processedCount}, sent ${notificationsSentCount} notifications.`);

        return {
            success: true,
            message: `Processed ${processedCount} due reminders.`,
            processedReminderIds: processedReminderIds,
            notificationsSent: notificationsSentCount,
        };

    } catch (error) {
        console.error("Error in reminder scheduler:", error);
        return { error: "Failed to process due reminders." };
    }
};