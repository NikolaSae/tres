// /actions/humanitarian-renewals/delete.ts
"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function deleteHumanitarianRenewal(renewalId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Neautorizovan pristup" };
    }

    // Proveri da li korisnik ima dozvolu za brisanje
    // (samo admin ili manager može da briše obnove)
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return { error: "Nemate dozvolu za brisanje obnova" };
    }

    if (!renewalId) {
      return { error: "ID obnove je obavezan" };
    }

    // Pronađi obnovu pre brisanja
    const renewal = await db.humanitarianContractRenewal.findUnique({
      where: { id: renewalId },
      include: {
        contract: true,
        humanitarianOrg: true
      }
    });

    if (!renewal) {
      return { error: "Obnova nije pronađena" };
    }

    // Ne dozvoli brisanje obnova koje su u završnoj fazi
    if (renewal.subStatus === "FINAL_PROCESSING") {
      return { error: "Ne može se obrisati obnova koja je u završnoj fazi" };
    }

    // Obriši obnovu
    await db.humanitarianContractRenewal.delete({
      where: { id: renewalId }
    });

    // Log aktivnost
    await db.activityLog.create({
      data: {
        action: "DELETE_HUMANITARIAN_RENEWAL",
        entityType: "humanitarian_renewal",
        entityId: renewalId,
        details: `Obrisana obnova ugovora ${renewal.contract.contractNumber} za ${renewal.humanitarianOrg.name}`,
        userId: session.user.id,
        severity: "WARNING"
      }
    });

    revalidatePath("/humanitarian-renewals");
    return { success: "Obnova je uspešno obrisana" };

  } catch (error) {
    console.error("Greška pri brisanju obnove:", error);
    return { error: "Došlo je do greške pri brisanju obnove" };
  }
}

export async function bulkDeleteHumanitarianRenewals(renewalIds: string[]) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Neautorizovan pristup" };
    }

    // Proveri dozvole
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return { error: "Nemate dozvolu za brisanje obnova" };
    }

    if (!renewalIds || renewalIds.length === 0) {
      return { error: "Nijedna obnova nije izabrana" };
    }

    // Pronađi sve obnove
    const renewals = await db.humanitarianContractRenewal.findMany({
      where: {
        id: {
          in: renewalIds
        }
      },
      include: {
        contract: true,
        humanitarianOrg: true
      }
    });

    if (renewals.length === 0) {
      return { error: "Nijedna obnova nije pronađena" };
    }

    // Proveri da li su sve obnove u dozvoljenom statusu za brisanje
    const finalProcessingRenewals = renewals.filter(r => r.subStatus === "FINAL_PROCESSING");
    if (finalProcessingRenewals.length > 0) {
      return { 
        error: `Ne mogu se obrisati obnove koje su u završnoj fazi: ${finalProcessingRenewals.map(r => r.contract.contractNumber).join(", ")}` 
      };
    }

    // Obriši sve obnove
    const deleteResult = await db.humanitarianContractRenewal.deleteMany({
      where: {
        id: {
          in: renewalIds
        }
      }
    });

    // Log aktivnost
    await db.activityLog.create({
      data: {
        action: "BULK_DELETE_HUMANITARIAN_RENEWALS",
        entityType: "humanitarian_renewal",
        details: `Grupno obrisane obnove: ${renewals.map(r => r.contract.contractNumber).join(", ")}`,
        userId: session.user.id,
        severity: "WARNING"
      }
    });

    revalidatePath("/humanitarian-renewals");
    return { 
      success: `Uspešno obrisano ${deleteResult.count} obnova`,
      count: deleteResult.count
    };

  } catch (error) {
    console.error("Greška pri grupnom brisanju obnova:", error);
    return { error: "Došlo je do greške pri brisanju obnova" };
  }
}