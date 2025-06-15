// /actions/contracts/add-service.ts
'use server';

import { db } from '@/lib/db'; // Pretpostavljena putanja do vašeg Prisma klijenta
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth'; // Pretpostavljena putanja do vašeg auth helpera
import { z } from 'zod'; // Koristimo Zod za osnovnu validaciju ID-jeva

// Osnovna šema za validaciju ulaznih podataka
const AddServiceSchema = z.object({
  contractId: z.string().cuid("Invalid contract ID format"), // Pretpostavka da koristite CUIDs
  serviceId: z.string().cuid("Invalid service ID format"),   // Pretpostavka da koristite CUIDs
  specificTerms: z.string().optional().nullable(),
});

/**
 * Povezuje servis sa ugovorom.
 * @param values - Objekat koji sadrži contractId, serviceId i opcione specificTerms.
 * @returns Uspeh/neuspeh operacije i, u slučaju uspeha, podatke o kreiranom ServiceContract zapisu.
 */
export const addContractService = async (values: z.infer<typeof AddServiceSchema>) => {
  // 1. Validacija ulaznih podataka
  const validatedFields = AddServiceSchema.safeParse(values);

  if (!validatedFields.success) {
    console.error("Validation failed:", validatedFields.error.errors);
    return { error: "Invalid input fields!" };
  }

  const { contractId, serviceId, specificTerms } = validatedFields.data;

  // 2. Dobijanje ID-a trenutnog korisnika (opciono, za logovanje/audit)
  const session = await auth();
  const userId = session?.user?.id;

   if (!userId) {
     // Opciono: provera autorizacije
     // return { error: "Unauthorized" };
   }


  try {
    // 3. Provera da li ugovor i servis postoje
    const contractExists = await db.contract.findUnique({ where: { id: contractId } });
    const serviceExists = await db.service.findUnique({ where: { id: serviceId } });

    if (!contractExists) {
      return { error: "Contract not found." };
    }
     if (!serviceExists) {
      return { error: "Service not found." };
    }


    // 4. Provera da li je servis već povezan sa ovim ugovorom
    const existingServiceContract = await db.serviceContract.findUnique({
      where: {
        contractId_serviceId: { // Jedinstveni par definisan u Prisma šemi
          contractId: contractId,
          serviceId: serviceId,
        },
      },
    });

    if (existingServiceContract) {
      return { error: "Service is already linked to this contract." };
    }

    // 5. Kreiranje ServiceContract zapisa
    const newServiceContract = await db.serviceContract.create({
      data: {
        contractId: contractId,
        serviceId: serviceId,
        specificTerms: specificTerms,
      },
      include: {
        service: true, // Učitavamo detalje servisa za povratnu informaciju
      }
    });

    // 6. Revalidacija cache-a za stranicu detalja ugovora
    revalidatePath(`/app/(protected)/contracts/${contractId}`);
    // Opciono: revalidirati i listu servisa komponentu ako je odvojena ruta

    return { success: "Service linked successfully!", serviceContract: newServiceContract };

  } catch (error) {
    console.error(`Error adding service ${serviceId} to contract ${contractId}:`, error);
    // Generalna greška servera
    return { error: "Failed to link service to contract." };
  }
};