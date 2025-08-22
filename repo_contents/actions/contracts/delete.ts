// Path: /actions/contracts/delete.ts
'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { LogSeverity } from '@prisma/client'; // Uvezite LogSeverity

export const deleteContract = async (id: string) => {
  // 1. Dobijanje ID-a trenutnog korisnika i provera sesije
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
      // Opciono: rigoroznija provera autorizacije pre brisanja
      return { error: "Unauthorized. Please sign in to delete a contract.", success: false }; // Dodajte success: false
  }

  try {
    // 2. Provera da li ugovor postoji pre brisanja i dohvatanje detalja za logovanje
    const existingContract = await db.contract.findUnique({
      where: { id },
      select: { // Selektujte polja koja ce vam trebati za log detalje
          id: true,
          contractNumber: true,
          name: true,
          // Dodajte ostala polja ako zelite da ih logujete
      }
    });

    if (!existingContract) {
      return { error: "Contract not found.", success: false }; // Dodajte success: false
    }

    // 3. Brisanje ugovora
    await db.contract.delete({
      where: { id },
    });

    // --- LOG ACTIVITY ---
    await db.activityLog.create({
      data: {
        action: "CONTRACT_DELETED", // Opis radnje (brisanje)
        entityType: "contract",    // Tip entiteta
        entityId: existingContract.id, // ID obrisanog entiteta
        // Detalji radnje - koristimo informacije pre brisanja
        details: `Contract deleted: ${existingContract.contractNumber} - ${existingContract.name}`,
        userId: userId,   // ID korisnika koji je izvrsio brisanje
        severity: "INFO", // Nivo severnosti (moze biti WARNING za brisanje)
                          // Koristimo INFO radi konzistentnosti sa CREATE, ali WARNING je takodje validan izbor
      },
    });
    // --- KRAJ LOGOVANJA ---


    // 4. Revalidacija cache-a za stranice sa ugovorima
    revalidatePath('/contracts');
    revalidatePath(`/contracts/${existingContract.id}`); // Revalidacija stranice specificnog ugovora (sada ce vratiti 404 ili slicno)


    return { success: true, message: "Contract deleted successfully!" }; // Vratite success: true

  } catch (error) {
    console.error(`[CONTRACT_DELETE_ERROR] Error deleting contract with ID ${id}:`, error); // Standardizovan log format

    // Opciono: Prošireno rukovanje greškama slično CREATE akciji ako je potrebno
    // if (error instanceof Error) { ... }

    return { error: "Failed to delete contract.", success: false, message: "An error occurred during deletion." }; // Vratite success: false i genericku poruku
  }
};