// /lib/contracts/notification-sender.ts

import { db } from '@/lib/db'; // Pretpostavljena putanja do vašeg Prisma klijenta
import { NotificationType, Contract, ContractReminder, User } from '@prisma/client'; // Prisma modeli i enumi
import { format } from 'date-fns'; // Utility za formatiranje datuma

// Pretpostavljeni interfejsi za kontekst
interface ContractNotificationContext extends Partial<Contract> {
     id: string; // ID ugovora je neophodan
     name?: string;
     contractNumber?: string;
     endDate?: Date;
}

interface ReminderNotificationContext extends Partial<ContractReminder> {
    id: string; // ID podsetnika je neophodan
    reminderDate?: Date;
    reminderType?: string;
    contract?: ContractNotificationContext | null;
}


/**
 * Kreira zapis o in-app notifikaciji u bazi podataka.
 * @param params - Parametri za kreiranje notifikacije.
 * @returns Kreirani Notification zapis ili null u slučaju greške.
 */
const createNotification = async (params: {
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    entityType?: string; // Npr. 'contract', 'reminder'
    entityId?: string;   // ID povezanog entiteta
}): Promise<typeof db.notification.$create> | null => {
    try {
        const notification = await db.notification.create({
            data: {
                userId: params.userId,
                title: params.title,
                message: params.message,
                type: params.type,
                entityType: params.entityType,
                entityId: params.entityId,
                // isRead je false po defaultu
            },
        });
        return notification;
    } catch (error) {
        console.error("Error creating in-app notification:", error);
        return null; // Vraća null u slučaju greške
    }
};

/**
 * Šalje email notifikaciju (placeholder).
 * Ovu funkciju treba zameniti integracijom sa vašim servisom za slanje emailova (SendGrid, Nodemailer, itd.).
 * @param recipientEmail - Email adresa primaoca.
 * @param subject - Naslov emaila.
 * @param body - Telo emaila.
 * @returns Promise<boolean> - True ako je poslato (simulirano), False u slučaju greške.
 */
const sendEmail = async (recipientEmail: string, subject: string, body: string): Promise<boolean> => {
    console.log(`Simulating sending email to ${recipientEmail}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body}`);

    // Simulacija slanja emaila
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log("Simulated email sent.");
    return true; // Simulacija uspeha
};


/**
 * Šalje notifikaciju o isteku ugovora.
 * Kreira in-app notifikaciju i opcionalno šalje email.
 * @param contract - Podaci o ugovoru (sa ID, name, endDate, itd.).
 * @param recipientUserId - ID korisnika kome se šalje in-app notifikacija.
 * @param recipientEmail - Email adresa primaoca za email notifikaciju (opciono).
 * @param daysLeft - Broj dana pre isteka.
 */
export const sendContractExpirationNotification = async (
    contract: ContractNotificationContext,
    recipientUserId: string,
    recipientEmail: string | null,
    daysLeft: number
) => {
    const title = `Contract "${contract.name || contract.contractNumber}" is expiring soon`;
    const message = `Contract "${contract.name || contract.contractNumber}" with number ${contract.contractNumber || 'N/A'} is expiring in ${daysLeft} days on ${contract.endDate ? format(contract.endDate, 'PPP') : 'N/A'}.`; // Formatirajte datum po potrebi

    // Kreiraj in-app notifikaciju
    await createNotification({
        userId: recipientUserId,
        title,
        message,
        type: NotificationType.CONTRACT_EXPIRING,
        entityType: 'contract',
        entityId: contract.id,
    });

    // Opcionalno pošalji email
    if (recipientEmail) {
        await sendEmail(recipientEmail, title, message);
    }
};


/**
 * Šalje notifikaciju za opšti podsetnik ugovora.
 * Kreira in-app notifikaciju i opcionalno šalje email.
 * @param reminder - Podaci o podsetniku (sa ID, reminderType, reminderDate, i povezanim ugovorom).
 * @param recipientUserId - ID korisnika kome se šalje in-app notifikacija.
 * @param recipientEmail - Email adresa primaoca za email notifikaciju (opciono).
 * @param customMessage - Opciona prilagođena poruka.
 */
export const sendReminderNotification = async (
    reminder: ReminderNotificationContext,
    recipientUserId: string,
    recipientEmail: string | null,
    customMessage?: string
) => {
    const contractNumber = reminder.contract?.contractNumber || 'N/A';
    const contractName = reminder.contract?.name || 'N/A';
    const reminderDateStr = reminder.reminderDate ? format(reminder.reminderDate, 'PPP') : 'N/A'; // Formatirajte datum

    const title = `Contract Reminder: ${reminder.reminderType?.toUpperCase() || 'General'}`;
    const defaultMessage = `Reminder for contract "${contractName}" (Number: ${contractNumber}) for type "${reminder.reminderType}" scheduled for ${reminderDateStr}.`;
    const message = customMessage || defaultMessage;

    // Kreiraj in-app notifikaciju
    await createNotification({
        userId: recipientUserId,
        title,
        message,
        type: NotificationType.REMINDER, // Koristimo REMINDER tip notifikacije
        entityType: 'reminder',
        entityId: reminder.id,
    });

     // Opcionalno pošalji email
    if (recipientEmail) {
        await sendEmail(recipientEmail, title, message);
    }
};


// Možete dodati još funkcija za specifične tipove notifikacija ako je potrebno
// npr. sendContractRenewalStatusChangeNotification, sendComplaintAssignedNotification, itd.