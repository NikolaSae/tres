// /actions/humanitarian-renewals/update.ts
"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { updateHumanitarianRenewalSchema } from "@/schemas/humanitarian-renewal";
import { revalidatePath } from "next/cache";

export async function updateHumanitarianRenewal(values: any) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Neautorizovan pristup" };
    }

    const validatedFields = updateHumanitarianRenewalSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Neispravni podaci", details: validatedFields.error.flatten() };
    }

    const { id, contractId, humanitarianOrgId, ...data } = validatedFields.data;

    // Pronađi postojeću obnovu
    const existingRenewal = await db.humanitarianContractRenewal.findUnique({
      where: { id },
      include: {
        contract: true,
        humanitarianOrg: true
      }
    });

    if (!existingRenewal) {
      return { error: "Obnova nije pronađena" };
    }

    // Sačuvaj prethodni status za history
    const previousStatus = existingRenewal.subStatus;
    const statusChanged = previousStatus !== data.subStatus;

    const updatedRenewal = await db.humanitarianContractRenewal.update({
      where: { id },
      data: {
        proposedStartDate: new Date(data.proposedStartDate),
        proposedEndDate: new Date(data.proposedEndDate),
        proposedRevenue: data.proposedRevenue,
        subStatus: data.subStatus,
        documentsReceived: data.documentsReceived,
        legalApproved: data.legalApproved,
        financialApproved: data.financialApproved,
        signatureReceived: data.signatureReceived,
        notes: data.notes,
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
        },
        lastModifiedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Log aktivnost
    let activityDetails = `Ažurirana obnova ugovora ${existingRenewal.contract.contractNumber}`;
    if (statusChanged) {
      activityDetails += ` - status promenjen sa ${previousStatus} na ${data.subStatus}`;
    }

    await db.activityLog.create({
      data: {
        action: "UPDATE_HUMANITARIAN_RENEWAL",
        entityType: "humanitarian_renewal",
        entityId: id,
        details: activityDetails,
        userId: session.user.id,
      }
    });

    // Ako je status Final Processing, možda treba aktivirati novi ugovor
    if (data.subStatus === "FINAL_PROCESSING" && data.signatureReceived) {
      // TODO: Implementirati logiku za kreiranje novog ugovora
      // ili ažuriranje postojećeg ugovora sa novim datumima
    }

    revalidatePath("/humanitarian-renewals");
    return { success: "Obnova je uspešno ažurirana", data: updatedRenewal };

  } catch (error) {
    console.error("Greška pri ažuriranju obnove:", error);
    return { error: "Došlo je do greške pri ažuriranju obnove" };
  }
}