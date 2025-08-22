// /lib/actions/contract-actions.ts
"use server";

import { db } from "@/lib/db";
import { ContractStatus, ContractRenewalSubStatus } from "@/lib/types/contract-types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Action za promenu statusa ugovora
export async function updateContractStatus(
  contractId: string,
  newStatus: ContractStatus,
  comments?: string
) {
  try {
    // Validacija da ugovor postoji
    const existingContract = await db.contract.findUnique({
      where: { id: contractId },
      include: {
        renewals: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!existingContract) {
      throw new Error("Contract not found");
    }

    // Ako menjamo status sa RENEWAL_IN_PROGRESS na nešto drugo, 
    // treba da deaktiviramo trenutni renewal
    if (existingContract.status === ContractStatus.RENEWAL_IN_PROGRESS && 
        newStatus !== ContractStatus.RENEWAL_IN_PROGRESS) {
      
      const activeRenewal = existingContract.renewals[0];
      if (activeRenewal) {
        await db.contractRenewal.update({
          where: { id: activeRenewal.id },
          data: { 
            isActive: false,
            completedAt: new Date(),
            notes: comments ? `Status changed: ${comments}` : "Status changed from renewal in progress"
          }
        });
      }
    }

    // Ažuriranje statusa ugovora
    const updatedContract = await db.contract.update({
      where: { id: contractId },
      data: {
        status: newStatus,
        updatedAt: new Date()
      }
    });

    // Kreiranje log unosa za promenu statusa
    await db.contractStatusLog.create({
      data: {
        contractId: contractId,
        oldStatus: existingContract.status,
        newStatus: newStatus,
        comments: comments || "",
        changedBy: "system", // Ovde biste trebali da stavite trenutnog korisnika
        changedAt: new Date()
      }
    });

    // Revalidacija stranica
    revalidatePath("/contracts");
    revalidatePath(`/contracts/${contractId}`);

    return {
      success: true,
      message: "Contract status updated successfully",
      data: updatedContract
    };

  } catch (error) {
    console.error("Error updating contract status:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update contract status"
    };
  }
}

// Action za promenu podstatusa renewal-a
export async function updateRenewalSubStatus(
  contractId: string,
  newSubStatus: ContractRenewalSubStatus,
  comments?: string
) {
  try {
    // Pronalaženje aktivnog renewal-a
    const activeRenewal = await db.contractRenewal.findFirst({
      where: {
        contractId: contractId,
        isActive: true
      }
    });

    if (!activeRenewal) {
      throw new Error("No active renewal found for this contract");
    }

    // Ažuriranje podstatusa
    const updatedRenewal = await db.contractRenewal.update({
      where: { id: activeRenewal.id },
      data: {
        subStatus: newSubStatus,
        updatedAt: new Date(),
        notes: comments ? `${activeRenewal.notes || ''}\n\nStatus update: ${comments}`.trim() : activeRenewal.notes
      }
    });

    // Kreiranje log unosa za promenu podstatusa
    await db.renewalStatusLog.create({
      data: {
        renewalId: activeRenewal.id,
        oldSubStatus: activeRenewal.subStatus,
        newSubStatus: newSubStatus,
        comments: comments || "",
        changedBy: "system", // Ovde biste trebali da stavite trenutnog korisnika
        changedAt: new Date()
      }
    });

    // Revalidacija stranica
    revalidatePath("/contracts");
    revalidatePath(`/contracts/${contractId}`);

    return {
      success: true,
      message: "Renewal sub-status updated successfully",
      data: updatedRenewal
    };

  } catch (error) {
    console.error("Error updating renewal sub-status:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update renewal sub-status"
    };
  }
}

// Action za kreiranje novog renewal procesa
export async function startContractRenewal(
  contractId: string,
  initialSubStatus: ContractRenewalSubStatus = ContractRenewalSubStatus.DOCUMENT_COLLECTION,
  notes?: string
) {
  try {
    // Validacija da ugovor postoji i da je u odgovarajućem statusu
    const contract = await db.contract.findUnique({
      where: { id: contractId },
      include: {
        renewals: {
          where: { isActive: true }
        }
      }
    });

    if (!contract) {
      throw new Error("Contract not found");
    }

    if (contract.status !== ContractStatus.ACTIVE && contract.status !== ContractStatus.PENDING) {
      throw new Error("Contract must be ACTIVE or PENDING to start renewal");
    }

    // Proverava da li već postoji aktivan renewal
    if (contract.renewals.length > 0) {
      throw new Error("Contract already has an active renewal process");
    }

    // Kreiranje novog renewal procesa
    const newRenewal = await db.contractRenewal.create({
      data: {
        contractId: contractId,
        subStatus: initialSubStatus,
        isActive: true,
        notes: notes || "",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Ažuriranje statusa ugovora na RENEWAL_IN_PROGRESS
    await db.contract.update({
      where: { id: contractId },
      data: {
        status: ContractStatus.RENEWAL_IN_PROGRESS,
        updatedAt: new Date()
      }
    });

    // Kreiranje log unosa
    await db.contractStatusLog.create({
      data: {
        contractId: contractId,
        oldStatus: contract.status,
        newStatus: ContractStatus.RENEWAL_IN_PROGRESS,
        comments: "Renewal process started",
        changedBy: "system",
        changedAt: new Date()
      }
    });

    await db.renewalStatusLog.create({
      data: {
        renewalId: newRenewal.id,
        oldSubStatus: null,
        newSubStatus: initialSubStatus,
        comments: "Renewal process initiated",
        changedBy: "system",
        changedAt: new Date()
      }
    });

    // Revalidacija stranica
    revalidatePath("/contracts");
    revalidatePath(`/contracts/${contractId}`);

    return {
      success: true,
      message: "Contract renewal started successfully",
      data: newRenewal
    };

  } catch (error) {
    console.error("Error starting contract renewal:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to start contract renewal"
    };
  }
}

// Action za završavanje renewal procesa
export async function completeContractRenewal(
  contractId: string,
  newContractData?: {
    startDate?: string;
    endDate?: string;
    value?: number;
  },
  notes?: string
) {
  try {
    // Pronalaženje aktivnog renewal-a
    const activeRenewal = await db.contractRenewal.findFirst({
      where: {
        contractId: contractId,
        isActive: true
      }
    });

    if (!activeRenewal) {
      throw new Error("No active renewal found for this contract");
    }

    // Ažuriranje renewal-a kao završen
    await db.contractRenewal.update({
      where: { id: activeRenewal.id },
      data: {
        isActive: false,
        completedAt: new Date(),
        notes: notes ? `${activeRenewal.notes || ''}\n\nCompletion notes: ${notes}`.trim() : activeRenewal.notes
      }
    });

    // Ažuriranje ugovora
    const updateData: any = {
      status: ContractStatus.ACTIVE,
      updatedAt: new Date()
    };

    if (newContractData) {
      if (newContractData.startDate) updateData.startDate = new Date(newContractData.startDate);
      if (newContractData.endDate) updateData.endDate = new Date(newContractData.endDate);
      if (newContractData.value) updateData.value = newContractData.value;
    }

    const updatedContract = await db.contract.update({
      where: { id: contractId },
      data: updateData
    });

    // Log unosi
    await db.contractStatusLog.create({
      data: {
        contractId: contractId,
        oldStatus: ContractStatus.RENEWAL_IN_PROGRESS,
        newStatus: ContractStatus.ACTIVE,
        comments: "Renewal process completed",
        changedBy: "system",
        changedAt: new Date()
      }
    });

    // Revalidacija stranica
    revalidatePath("/contracts");
    revalidatePath(`/contracts/${contractId}`);

    return {
      success: true,
      message: "Contract renewal completed successfully",
      data: updatedContract
    };

  } catch (error) {
    console.error("Error completing contract renewal:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to complete contract renewal"
    };
  }
}