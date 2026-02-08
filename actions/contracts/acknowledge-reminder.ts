// /actions/contracts/acknowledge-reminder.ts
'use server';

import { db } from '@/lib/db';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export async function acknowledgeReminder(reminderId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Morate biti prijavljeni da biste potvrdili podsetnik.' };
  }

  if (!reminderId) {
    return { error: 'Reminder ID je obavezan.' };
  }

  try {
    const reminder = await db.contractReminder.findUnique({
      where: { id: reminderId },
      select: {
        id: true,
        contractId: true,
        isAcknowledged: true,
        acknowledgedById: true,
      },
    });

    if (!reminder) {
      return { error: 'Podsetnik nije pronađen.' };
    }

    if (reminder.isAcknowledged) {
      return { info: 'Podsetnik je već potvrđen.' };
    }

    const updated = await db.contractReminder.update({
      where: { id: reminderId },
      data: {
        isAcknowledged: true,
        acknowledgedById: session.user.id, // ← beleži ko je potvrdio
      },
    });

    revalidatePath(`/contracts/${updated.contractId}`);

    return {
      success: 'Podsetnik uspešno potvrđen.',
      reminderId: updated.id,
    };
  } catch (error) {
    console.error(`Greška pri potvrđivanju podsetnika ${reminderId}:`, error);
    return { error: 'Neuspešno potvrđivanje podsetnika.' };
  }
}