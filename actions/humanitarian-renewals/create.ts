// /actions/humanitarian-renewals/create.ts
"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { createHumanitarianRenewalSchema } from "@/schemas/humanitarian-renewal";
import { revalidatePath } from "next/cache";

export async function createHumanitarianRenewal(values: any) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Neautorizovan pristup" };
    }

    const validatedFields = createHumanitarianRenewalSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Neispravni podaci", details: validatedFields.error.flatten() };
    }

    const { contractId, humanitarianOrgId, ...data } = validatedFields.data;

    // Proveri da li ugovor postoji i pripada humanitarnoj organizaciji
    const contract = await db.contract.findFirst({
      where: {
        id: contractId,
        humanitarianOrgId: humanitarianOrgId,
        type: "HUMANITARIAN"
      }
    });

    if (!contract) {
      return { error: "Ugovor nije pronađen ili ne pripada ovoj organizaciji" };
    }

    // Proveri da li već postoji aktivna obnova za ovaj ugovor
    const existingRenewal = await db.humanitarianContractRenewal.findFirst({
      where: {
        contractId: contractId,
        subStatus: {
          not: "FINAL_PROCESSING"
        }
      }
    });

    if (existingRenewal) {
      return { error: "Već postoji aktivna obnova za ovaj ugovor" };
    }

    const renewal = await db.humanitarianContractRenewal.create({
      data: {
        contractId,
        humanitarianOrgId,
        proposedStartDate: new Date(data.proposedStartDate),
        proposedEndDate: new Date(data.proposedEndDate),
        proposedRevenue: data.proposedRevenue,
        subStatus: data.subStatus,
        documentsReceived: data.documentsReceived,
        legalApproved: data.legalApproved,
        financialApproved: data.financialApproved,
        signatureReceived: data.signatureReceived,
        notes: data.notes,
        createdById: session.user.id,
        lastModifiedById: session.user.id,
      },
      include: {
        contract: {
          include: {
            humanitarianOrg: true
          }
        },
        humanitarianOrg: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Log aktivnost
    await db.activityLog.create({
      data: {
        action: "CREATE_HUMANITARIAN_RENEWAL",
        entityType: "humanitarian_renewal",
        entityId: renewal.id,
        details: `Kreirana obnova ugovora ${contract.contractNumber}`,
        userId: session.user.id,
      }
    });

    revalidatePath("/humanitarian-renewals");
    return { success: "Obnova ugovora je uspešno kreirana", data: renewal };

  } catch (error) {
    console.error("Greška pri kreiranju obnove:", error);
    return { error: "Došlo je do greške pri kreiranju obnove" };
  }
}