// /actions/contracts/remove-service.ts
'use server';

import { db } from '@/lib/db'; // Pretpostavljena putanja do vašeg Prisma klijenta
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth'; // Pretpostavljena putanja do vašeg auth helpera
import { z } from 'zod'; // Koristimo Zod za osnovnu validaciju ID-jeva

// Osnovna šema za validaciju ulaznih podataka
const RemoveServiceSchema = z.object({
  contractId: z.string().cuid("Invalid contract ID format"), // Pretpostavka da koristite CUIDs
  serviceId: z.string().cuid("Invalid service ID format"),   // Pretpostavka da koristite CUIDs
});

/**
 * Uklanja povezanost servisa sa ugovorom.
 * @param values - Objekat koji sadrži contractId i serviceId veze koju treba ukloniti.
 * @returns Uspeh/neuspeh operacije.
 */
export const removeContractService = async (values: z.infer<typeof RemoveServiceSchema>) => {
  // 1. Validacija ulaznih podataka
  const validatedFields = RemoveServiceSchema.safeParse(values);

  if (!validatedFields.success) {
    console.error("Validation failed:", validatedFields.error.errors);
    return { error: "Invalid input fields!" };
  }

  const { contractId, serviceId } = validatedFields.data;

  // 2. Dobijanje ID-a trenutnog korisnika (opciono, za logovanje/audit)
  const session = await auth();
  const userId = session?.user?.id;

   if (!userId) {
     // Opciono: provera autorizacije
     // return { error: "Unauthorized" };
   }

  try {
    // 3. Provera da li veza postoji pre brisanja (opciono, delete ne baca grešku ako ne nađe, ali deleteMany da)
    // Bolje je koristiti deleteMany kada se briše po uslovima koji nisu @unique ID.
     const deleteResult = await db.serviceContract.deleteMany({
       where: {
         contractId: contractId,
         serviceId: serviceId,
       },
     });

    if (deleteResult.count === 0) {
        return { error: "Service link not found for this contract." };
    }


    // 4. Revalidacija cache-a za stranicu detalja ugovora
    revalidatePath(`/app/(protected)/contracts/${contractId}`);
    // Opciono: revalidirati i listu servisa komponentu ako je odvojena ruta

    return { success: "Service unlinked successfully!" };

  } catch (error) {
    console.error(`Error removing service ${serviceId} from contract ${contractId}:`, error);
    // Generalna greška servera
    return { error: "Failed to unlink service from contract." };
  }
};