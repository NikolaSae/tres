//lib/actions/contract-actions.ts
"use server";

import { db } from "@/lib/db";
import { ContractStatus, ContractRenewalSubStatus } from "@/lib/types/contract-types";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

async function getCurrentUserId() {
  const session = await auth();
  return session?.user?.id || "system";
}

export async function updateContractStatus(
  contractId: string,
  newStatus: ContractStatus,
  comments?: string
) {
  try {
    const existingContract = await db.contract.findUnique({
      where: { id: contractId },
      include: {
        renewals: {
          // ✅ PRIVREMENO: bez isActive filtera
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!existingContract) {
      throw new Error("Contract not found");
    }

    if (existingContract.status === ContractStatus.RENEWAL_IN_PROGRESS && 
        newStatus !== ContractStatus.RENEWAL_IN_PROGRESS) {
      
      const activeRenewal = existingContract.renewals[0];
      if (activeRenewal) {
        await db.contractRenewal.update({
          where: { id: activeRenewal.id },
          data: { 
            // ✅ PRIVREMENO: samo internalNotes
            internalNotes: comments ? `Completed: ${comments}` : "Renewal completed"
          }
        });
      }
    }

    const updatedContract = await db.contract.update({
      where: { id: contractId },
      data: {
        status: newStatus,
        updatedAt: new Date()
      }
    });

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

export async function updateRenewalSubStatus(
  contractId: string,
  newSubStatus: ContractRenewalSubStatus,
  comments?: string
) {
  try {
    const activeRenewal = await db.contractRenewal.findFirst({
      where: {
        contractId: contractId,
        // ✅ PRIVREMENO: bez isActive
      },
      orderBy: { createdAt: 'desc' },
      take: 1
    });

    if (!activeRenewal) {
      throw new Error("No active renewal found for this contract");
    }

    const updatedRenewal = await db.contractRenewal.update({
      where: { id: activeRenewal.id },
      data: {
        subStatus: newSubStatus,
        updatedAt: new Date(),
        internalNotes: comments ? `${activeRenewal.internalNotes || ''}\n\n${comments}`.trim() : activeRenewal.internalNotes
      }
    });

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

export async function startContractRenewal(
  contractId: string,
  initialSubStatus: ContractRenewalSubStatus = ContractRenewalSubStatus.DOCUMENT_COLLECTION,
  notes?: string
) {
  try {
    const userId = await getCurrentUserId();
    
    const contract = await db.contract.findUnique({
      where: { id: contractId },
      include: {
        renewals: {
          where: { isActive: true } // ✅ Proveravamo samo aktivne renewals
        }
      }
    });

    if (!contract) {
      throw new Error("Contract not found");
    }

    // ✅ Provera 1: Ugovor mora biti ACTIVE ili PENDING
    if (contract.status !== ContractStatus.ACTIVE && 
        contract.status !== ContractStatus.PENDING) {
      throw new Error("Contract must be ACTIVE or PENDING to start renewal");
    }

    // ✅ Provera 2: Ne sme već da postoji aktivan renewal
    if (contract.renewals.length > 0) {
      throw new Error("Contract already has an active renewal process");
    }

    // ✅ Računamo proposed datume (produženje za 1 godinu)
    const proposedStartDate = new Date(contract.endDate);
    proposedStartDate.setDate(proposedStartDate.getDate() + 1);
    
    const proposedEndDate = new Date(proposedStartDate);
    proposedEndDate.setFullYear(proposedEndDate.getFullYear() + 1);

    const newRenewal = await db.contractRenewal.create({
      data: {
        contractId: contractId,
        subStatus: initialSubStatus,
        isActive: true,
        notes: notes || "",
        proposedStartDate: proposedStartDate,
        proposedEndDate: proposedEndDate,
        proposedRevenue: contract.revenuePercentage,
        createdById: userId,
      }
    });

    await db.contract.update({
      where: { id: contractId },
      data: {
        status: ContractStatus.RENEWAL_IN_PROGRESS,
        updatedAt: new Date()
      }
    });

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

export async function completeContractRenewal(
  contractId: string,
  newContractData?: {
    startDate?: string;
    endDate?: string;
    revenuePercentage?: number;
  },
  notes?: string
) {
  try {
    const activeRenewal = await db.contractRenewal.findFirst({
      where: {
        contractId: contractId,
      },
      orderBy: { createdAt: 'desc' },
      take: 1
    });

    if (!activeRenewal) {
      throw new Error("No active renewal found for this contract");
    }

    await db.contractRenewal.update({
      where: { id: activeRenewal.id },
      data: {
        internalNotes: notes ? `${activeRenewal.internalNotes || ''}\n\nCompleted: ${notes}`.trim() : activeRenewal.internalNotes
      }
    });

    const updateData: any = {
      status: ContractStatus.ACTIVE,
      updatedAt: new Date()
    };

    if (newContractData) {
      if (newContractData.startDate) updateData.startDate = new Date(newContractData.startDate);
      if (newContractData.endDate) updateData.endDate = new Date(newContractData.endDate);
      if (newContractData.revenuePercentage) updateData.revenuePercentage = newContractData.revenuePercentage;
    }

    const updatedContract = await db.contract.update({
      where: { id: contractId },
      data: updateData
    });

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