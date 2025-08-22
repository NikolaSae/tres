// /actions/contracts/acknowledge-reminder.ts
'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';


export async function acknowledgeReminder(reminderId: string): Promise<{ success?: string; reminderId?: string; error?: string }> {
    if (!reminderId) {
        return { error: 'Reminder ID is required.' };
    }

    try {
        const reminderToUpdate = await db.reminder.findUnique({
            where: { id: reminderId },
        });

        if (!reminderToUpdate) {
             return { error: 'Reminder not found.' };
        }

        const updatedReminder = await db.reminder.update({
            where: { id: reminderId },
            data: {
                isDismissed: true,

            },
        });

         revalidatePath(`/contracts/${updatedReminder.contractId}`);


        return { success: 'Reminder acknowledged.', reminderId: updatedReminder.id };

    } catch (error) {
        console.error(`Error acknowledging reminder ${reminderId}:`, error);
        return { error: 'Failed to acknowledge reminder.' };
    }
}