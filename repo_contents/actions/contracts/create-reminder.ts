// /actions/contracts/create-reminder.ts
'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';


const createReminderSchema = z.object({
    contractId: z.string().min(1, "Contract ID is required"),
    remindAt: z.string().datetime({ message: "Valid datetime string is required" }),
    message: z.string().optional(),
    isDismissed: z.boolean().default(false),
});


type CreateReminderFormData = z.infer<typeof createReminderSchema>;


export async function createReminder(data: CreateReminderFormData): Promise<{ success?: string; reminderId?: string; error?: string; details?: any }> {
    const validationResult = createReminderSchema.safeParse(data);

    if (!validationResult.success) {
        return {
            error: 'Validation failed.',
            details: validationResult.error.format(),
        };
    }

    const validatedData = validationResult.data;

    try {

        const reminder = await db.reminder.create({
            data: {
                contractId: validatedData.contractId,
                remindAt: new Date(validatedData.remindAt),
                message: validatedData.message || null,
                isDismissed: validatedData.isDismissed,

            },
        });


        revalidatePath(`/contracts/${validatedData.contractId}`);


        return { success: 'Reminder created successfully.', reminderId: reminder.id };

    } catch (error) {
        console.error("Error creating reminder:", error);
        return { error: 'Failed to create reminder.' };
    }
}