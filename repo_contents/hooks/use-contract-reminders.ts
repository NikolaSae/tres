// /hooks/use-contract-reminders.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { ContractReminder, User } from '@prisma/client'; // Prisma modeli
import { acknowledgeContractReminder } from '@/actions/contracts/acknowledge-reminder'; // Akcija za pregled podsetnika

// Tip za podsetnik sa uključenim acknowledgedBy korisnikom
interface ContractReminderWithUser extends ContractReminder {
    acknowledgedBy: { id: string; name: string | null; } | null;
}

interface UseContractRemindersResult {
  reminders: ContractReminderWithUser[];
  loading: boolean;
  error: Error | null;
  refreshReminders: () => void; // Funkcija za ručno osvežavanje liste podsetnika
  acknowledgeReminder: (reminderId: string) => Promise<{ success?: string; error?: string }>; // Funkcija za pregled podsetnika
}

/**
 * Hook za dohvatanje i upravljanje podsetnicima za specifičan ugovor.
 * @param contractId - ID ugovora za koji se dohvataju podsetnici. Može biti null ili undefined dok se učitava.
 * @returns Objekat sa listom podsetnika, statusom učitavanja, greškom i funkcijama za interakciju.
 */
export function useContractReminders(contractId: string | null | undefined): UseContractRemindersResult {
  const [reminders, setReminders] = useState<ContractReminderWithUser[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchReminders = useCallback(async () => {
    if (!contractId) {
      setReminders([]); // Resetuj listu ako nema contractId
      return;
    }

    setLoading(true);
    setError(null); // Resetuj grešku pri novom dohvatanju

    try {
      const response = await fetch(`/api/contracts/${contractId}/reminders`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch reminders: ${response.status}`);
      }

      const data: ContractReminderWithUser[] = await response.json();
      setReminders(data);

    } catch (err) {
      console.error(`Error fetching reminders for contract ${contractId}:`, err);
      setError(err instanceof Error ? err : new Error('Failed to fetch reminders.'));
    } finally {
      setLoading(false);
    }
  }, [contractId]); // Ponovo dohvati samo ako se contractId promeni

  // Dohvati podsetnike kada se hook montira ili contractId promeni
  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]); // Zavisnost od fetchReminders useCallback funkcije

  // Funkcija za ručno osvežavanje
  const refreshReminders = useCallback(() => {
    fetchReminders();
  }, [fetchReminders]);

  // Funkcija za pregled (acknowledge) podsetnika
  const acknowledgeReminder = useCallback(async (reminderId: string) => {
      const result = await acknowledgeContractReminder({ reminderId });

      if (result.success) {
          console.log(`Reminder ${reminderId} acknowledged.`);
          // Nakon uspešnog pregleda, osveži listu podsetnika
          refreshReminders();
      } else {
          console.error(`Failed to acknowledge reminder ${reminderId}:`, result.error);
      }
       return result; // Vraćanje rezultata akcije
  }, [refreshReminders]);


  return {
    reminders,
    loading,
    error,
    refreshReminders,
    acknowledgeReminder,
  };
}