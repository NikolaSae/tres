// actions/contracts/create-reminder.ts
'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/auth';

const createReminderSchema = z.object({
  contractId: z.string().min(1, 'ID ugovora je obavezan'),
  remindAt: z.coerce.date({ 
    invalid_type_error: 'Datum podsetnika mora biti validan datum',
    required_error: 'Datum podsetnika je obavezan',
  }).refine((date) => date > new Date(), {
    message: 'Datum podsetnika mora biti u budućnosti',
  }),
  message: z.string().optional(),
  isDismissed: z.boolean().default(false),
});

type CreateReminderFormData = z.infer<typeof createReminderSchema>;

export async function createReminder(data: CreateReminderFormData) {
  // Provera autentifikacije
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Morate biti prijavljeni da biste kreirali podsetnik.' };
  }

  // Validacija
  const validationResult = createReminderSchema.safeParse(data);

  if (!validationResult.success) {
    return {
      error: 'Validacija neuspešna.',
      details: validationResult.error.format(),
    };
  }

  const validatedData = validationResult.data;

  try {
    const reminder = await db.contractReminder.create({
      data: {
        contractId: validatedData.contractId,
        reminderDate: validatedData.remindAt,  // ← promenjeno u reminderDate (tačno ime polja u modelu)
        message: validatedData.message || null,
        isAcknowledged: validatedData.isDismissed,  // ← isAcknowledged umesto isDismissed (tačno ime polja)
        // Opciono: ako želiš da beležiš ko je kreirao
        // acknowledgedById: session.user.id,
      },
    });

    revalidatePath(`/contracts/${validatedData.contractId}`);

    return {
      success: 'Podsetnik uspešno kreiran.',
      reminderId: reminder.id,
    };
  } catch (error) {
    console.error('Greška pri kreiranju podsetnika:', error);

    if (error instanceof Error && 'code' in error) {
      if (error.code === 'P2003') {
        return { error: 'Ugovor sa datim ID-om ne postoji.' };
      }
    }

    return { error: 'Neuspešno kreiranje podsetnika.' };
  }
}