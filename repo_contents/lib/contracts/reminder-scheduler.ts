// /lib/contracts/reminder-scheduler.ts

import { db } from '@/lib/db'; // Pretpostavljena putanja do vašeg Prisma klijenta
import { ContractReminder, Contract, User } from '@prisma/client'; // Prisma modeli
import { sendReminderNotification } from '@/lib/contracts/notification-sender'; // Utility za slanje notifikacija (kreiraćemo kasnije)

// Tip koji proširuje Reminder sa potrebnim relacijama
interface DueReminder extends ContractReminder {
    contract: Contract | null; // Uključujemo podatke o ugovoru
    acknowledgedBy: User | null; // Podaci o tome ko je pregledao (trebalo bi biti null ovde)
    contract: { // Detalji ugovora potrebni za notifikaciju/kontekst
        id: string;
        name: string;
        contractNumber: string;
        createdBy: { id: string; email: string | null; name: string | null; } | null; // Ko je kreirao ugovor (potencijalni primalac notifikacije)
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
        const dueReminders: DueReminder[] = await db.contractReminder.findMany({
            where: {
                isAcknowledged: false, // Podsetnik nije pregledan
                reminderDate: {
                    lte: now, // Datum podsetnika je danas ili u prošlosti
                },
            },
             include: {
                // Uključujemo podatke o ugovoru i njegovom kreatoru za potrebe notifikacije
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
                 // Ne treba nam acknowledgedBy jer tražimo nepregledane
             },
        });

        let processedCount = 0;
        let notificationsSentCount = 0;
        const processedReminderIds = [];

        console.log(`Found ${dueReminders.length} due reminders to process.`);

        // 2. Obrada svakog dospelog podsetnika
        for (const reminder of dueReminders) {
             // Provera da li ugovor postoji (trebalo bi uvek, ali za svaki slučaj)
             if (!reminder.contract) {
                 console.warn(`Due reminder ${reminder.id} is linked to a non-existent contract.`);
                 continue; // Preskoči ovaj podsetnik
             }

            try {
                // Triggerovanje akcije na osnovu tipa podsetnika
                switch (reminder.reminderType) {
                    case 'expiration':
                        console.log(`Processing expiration reminder for contract ${reminder.contract.contractNumber}`);
                        // Primer: Slanje notifikacije kreatoru ugovora ili odgovornoj osobi
                        if (reminder.contract.createdBy?.email) {
                            await sendReminderNotification(
                                reminder,
                                reminder.contract.createdBy.email,
                                `Contract "${reminder.contract.name}" is expiring on ${reminder.reminderDate.toDateString()}`
                            );
                            notificationsSentCount++;
                        } else {
                             console.warn(`No creator email found for contract ${reminder.contract.contractNumber} for expiration reminder.`);
                        }
                        break;

                    case 'renewal':
                         console.log(`Processing renewal reminder for contract ${reminder.contract.contractNumber}`);
                         // Primer: Slanje notifikacije odgovornoj osobi/timu
                         // Ovde bi trebalo definisati kome se šalje notifikacija za obnovu
                         // Za sada šaljemo kreatoru, ali ovo treba prilagoditi vašoj logici
                          if (reminder.contract.createdBy?.email) {
                            await sendReminderNotification(
                                reminder,
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
                         // Primer: Slanje notifikacije menadžeru ili timu za pregled
                         // Slično kao za obnovu, definisati primaoca
                          if (reminder.contract.createdBy?.email) { // Prilagoditi primaoca!
                            await sendReminderNotification(
                                reminder,
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
                        // Možda logovati ili obraditi nepoznate tipove
                        break;
                }

                 // Opciono: Označiti podsetnik kao "obrađen od strane sistema"
                 // Ovo bi zavisilo od tačne definicije isAcknowledged polja.
                 // Ako isAcknowledged znači da je korisnik interagovao (kliknuo "dismiss"),
                 // onda ga ne treba automatski postavljati ovde.
                 // Ako znači da je sistem prepoznao i obradio podsetnik, onda bi se ovde postavilo.
                 // Za sada, nećemo ga automatski postavljati, već se oslanjamo na korisnika
                 // da ga označi kao pregledanog preko acknowledgeContractReminder akcije/API-ja.


                processedCount++;
                processedReminderIds.push(reminder.id);

            } catch (processingError) {
                 console.error(`Error processing reminder ${reminder.id}:`, processingError);
                 // Logovati grešku obrade, ali nastaviti sa sledećim podsetnikom
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

// Napomena: Ova funkcija processDueReminders() nije automatski pokrenuta.
// Morate je pozvati iz spoljnog mehanizma za zakazivanje zadataka (npr. cron job,
// Next.js API ruta koja se poziva periodično, serverless funkcija, itd.).