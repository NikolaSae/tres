// actions/bulk-services/create.ts
"use server";

import { db } from "@/lib/db";
import { ServerError } from "@/lib/exceptions";
import { bulkServiceSchema } from "@/schemas/bulk-service";
import { getCurrentUser } from "@/lib/session";
import { ActivityLogService } from "@/lib/services/activity-log-service";
import { LogSeverity, LogActionType, LogEntityType } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function createBulkService(data: unknown) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser?.id) {
      throw new Error("Unauthorized – korisnik nije prijavljen");
    }

    // Validacija ulaznih podataka
    const validatedData = bulkServiceSchema.parse(data);

    // Kreiranje bulk servisa
    const bulkService = await db.bulkService.create({
      data: {
        ...validatedData,
        createdAt: new Date(),
        updatedAt: new Date(),
        datumNaplate: new Date(), // ← privremeno rešenje – promeni prema logici aplikacije
        // Alternativne opcije:
        // datumNaplate: validatedData.datumNaplate || new Date(),
        // ili ako je opciono u šemi → ukloni ovu liniju
      },
      include: {
        provider: true,
        service: true,
      },
    });

    // Logovanje aktivnosti – koristimo Prisma enum vrednosti
    await ActivityLogService.log({
      action: LogActionType.CREATE_BULK_SERVICE, // ← mora da postoji u enum-u!
      entityType: LogEntityType.BULK_SERVICE,
      entityId: bulkService.id,
      details: `Kreiran novi bulk servis: ${bulkService.service_name} za ${bulkService.provider_name}`,
      severity: LogSeverity.INFO,
      userId: currentUser.id,
    });

    // Revalidacija putanje da bi se lista ažurirala
    revalidatePath("/bulk-services");
    // Ako imaš i druge putanje koje treba refresh-ovati:
    // revalidatePath("/dashboard/bulk-services");
    // revalidatePath("/api/bulk-services");

    return {
      success: true,
      bulkService,
      message: "Bulk servis uspešno kreiran",
    };
  } catch (error) {
    console.error("[CREATE_BULK_SERVICE]", error);

    // Bolje rukovanje greškama – možeš vratiti više informacija klijentu
    if (error instanceof Error) {
      throw new ServerError(`Neuspešno kreiranje bulk servisa: ${error.message}`);
    }

    throw new ServerError("Neočekivana greška prilikom kreiranja bulk servisa");
  }
}