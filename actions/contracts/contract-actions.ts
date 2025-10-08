// actions/contracts/contract-actions.ts
'use server'

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { ContractStatus, ContractRenewalSubStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function updateContractStatus(
  contractId: string,
  newStatus: ContractStatus,
  comments?: string
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return {
        success: false,
        message: 'Not authenticated'
      };
    }

    if (!contractId || !contractId.trim()) {
      return {
        success: false,
        message: 'Contract ID is required'
      };
    }

    if (!Object.values(ContractStatus).includes(newStatus)) {
      return {
        success: false,
        message: 'Invalid contract status'
      };
    }

    await db.$connect();

    const existingContract = await db.contract.findUnique({
      where: { id: contractId },
      include: {
        renewals: {
          orderBy: {
            createdAt: "desc"
          },
          take: 1
        }
      }
    });

    if (!existingContract) {
      return {
        success: false,
        message: 'Contract not found'
      };
    }

    const validationResult = validateStatusChange(existingContract.status, newStatus);
    
    if (!validationResult.isValid) {
      return {
        success: false,
        message: validationResult.message
      };
    }

    const updateData: any = {
      status: newStatus,
      updatedAt: new Date(),
    };

    if ('lastModifiedById' in existingContract) {
      updateData.lastModifiedById = session.user.id;
    }

    const updatedContract = await db.contract.update({
      where: { id: contractId },
      data: updateData
    });

    if (newStatus === ContractStatus.RENEWAL_IN_PROGRESS) {
      try {
        const renewalData: any = {
          contractId: contractId,
          subStatus: ContractRenewalSubStatus.DOCUMENT_COLLECTION,
          proposedStartDate: existingContract.endDate,
          proposedEndDate: new Date(existingContract.endDate.getTime() + (365 * 24 * 60 * 60 * 1000)),
          proposedRevenue: existingContract.revenuePercentage,
          documentsReceived: false,
          legalApproved: false,
          financialApproved: false,
          technicalApproved: false,
          managementApproved: false,
          signatureReceived: false,
          comments: comments || 'Renewal process started',
        };

        const renewalSchema = await db.contractRenewal.findFirst({ take: 1 });
        if (renewalSchema && 'createdById' in renewalSchema) {
          renewalData.createdById = session.user.id;
        }

        await db.contractRenewal.create({
          data: renewalData
        });
      } catch (renewalError) {
        console.error('Error creating renewal record:', renewalError);
      }
    }

    try {
      revalidatePath('/contracts');
      revalidatePath(`/contracts/${contractId}`);
    } catch (revalidateError) {
      console.error('Error revalidating paths:', revalidateError);
    }

    return {
      success: true,
      message: `Contract status updated to ${newStatus.replace(/_/g, ' ').toLowerCase()}`,
      contract: updatedContract,
      shouldRefresh: true
    };

  } catch (error) {
    console.error('Error in updateContractStatus:', error);
    
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as any;
      
      if (prismaError.code === 'P2025') {
        return {
          success: false,
          message: 'Contract not found or already deleted'
        };
      }
      
      if (prismaError.code === 'P2002') {
        return {
          success: false,
          message: 'Database constraint violation'
        };
      }
    }

    return {
      success: false,
      message: 'Failed to update contract status: ' + (error instanceof Error ? error.message : 'Unknown error')
    };
  }
}

export async function updateRenewalSubStatus(
  contractId: string,
  newSubStatus: ContractRenewalSubStatus,
  comments?: string
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return {
        success: false,
        message: 'Not authenticated'
      };
    }

    const latestRenewal = await db.contractRenewal.findFirst({
      where: { contractId },
      orderBy: { createdAt: 'desc' }
    });

    if (!latestRenewal) {
      return {
        success: false,
        message: 'No active renewal found for this contract'
      };
    }

    const updateData: any = {
      subStatus: newSubStatus,
      comments: comments || latestRenewal.comments,
      updatedAt: new Date(),
      
      ...(newSubStatus === ContractRenewalSubStatus.DOCUMENT_COLLECTION && {
        documentsReceived: true
      }),
      ...(newSubStatus === ContractRenewalSubStatus.LEGAL_REVIEW && {
        legalApproved: true
      }),
      ...(newSubStatus === ContractRenewalSubStatus.TECHNICAL_REVIEW && {
        technicalApproved: true
      }),
      ...(newSubStatus === ContractRenewalSubStatus.FINANCIAL_APPROVAL && {
        financialApproved: true
      }),
      ...(newSubStatus === ContractRenewalSubStatus.MANAGEMENT_APPROVAL && {
        managementApproved: true
      }),
      ...(newSubStatus === ContractRenewalSubStatus.AWAITING_SIGNATURE && {
        signatureReceived: false
      }),
      ...(newSubStatus === ContractRenewalSubStatus.FINAL_PROCESSING && {
        signatureReceived: true
      })
    };

    if ('lastModifiedById' in latestRenewal) {
      updateData.lastModifiedById = session.user.id;
    }

    const updatedRenewal = await db.contractRenewal.update({
      where: { id: latestRenewal.id },
      data: updateData
    });

    revalidatePath('/contracts');
    revalidatePath(`/contracts/${contractId}`);

    return {
      success: true,
      message: `Renewal status updated to ${newSubStatus.replace(/_/g, ' ').toLowerCase()}`,
      renewal: updatedRenewal,
      shouldRefresh: true
    };

  } catch (error) {
    console.error('Error updating renewal sub-status:', error);
    return {
      success: false,
      message: 'Failed to update renewal status: ' + (error instanceof Error ? error.message : 'Unknown error')
    };
  }
}

function validateStatusChange(currentStatus: ContractStatus, newStatus: ContractStatus) {
  const validTransitions: Record<ContractStatus, ContractStatus[]> = {
    [ContractStatus.DRAFT]: [ContractStatus.ACTIVE, ContractStatus.TERMINATED],
    [ContractStatus.ACTIVE]: [ContractStatus.RENEWAL_IN_PROGRESS, ContractStatus.EXPIRED, ContractStatus.TERMINATED],
    [ContractStatus.PENDING]: [ContractStatus.ACTIVE, ContractStatus.RENEWAL_IN_PROGRESS, ContractStatus.TERMINATED],
    [ContractStatus.RENEWAL_IN_PROGRESS]: [ContractStatus.ACTIVE, ContractStatus.EXPIRED, ContractStatus.TERMINATED],
    [ContractStatus.EXPIRED]: [ContractStatus.RENEWAL_IN_PROGRESS, ContractStatus.TERMINATED],
    [ContractStatus.TERMINATED]: []
  };

  const allowedTransitions = validTransitions[currentStatus] || [];
  
  if (!allowedTransitions.includes(newStatus)) {
    const errorMessage = `Cannot change status from ${currentStatus.replace(/_/g, ' ')} to ${newStatus.replace(/_/g, ' ')}`;
    return {
      isValid: false,
      message: errorMessage
    };
  }

  return { isValid: true, message: '' };
}

export async function completeContractRenewal(
  contractId: string,
  newContractData?: Partial<{
    startDate: Date;
    endDate: Date;
    revenuePercentage: number;
  }>,
  comments?: string
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return {
        success: false,
        message: 'Not authenticated'
      };
    }

    const contract = await db.contract.findUnique({
      where: { id: contractId },
      include: {
        renewals: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!contract) {
      return {
        success: false,
        message: 'Contract not found'
      };
    }

    const latestRenewal = contract.renewals[0];
    if (!latestRenewal) {
      return {
        success: false,
        message: 'No renewal found for this contract'
      };
    }

    if (latestRenewal.subStatus !== ContractRenewalSubStatus.FINAL_PROCESSING) {
      return {
        success: false,
        message: 'Renewal must be in final processing stage to complete'
      };
    }

    const result = await db.$transaction(async (tx) => {
      const contractUpdateData: any = {
        status: ContractStatus.ACTIVE,
        startDate: newContractData?.startDate || new Date(latestRenewal.proposedStartDate),
        endDate: newContractData?.endDate || new Date(latestRenewal.proposedEndDate),
        revenuePercentage: newContractData?.revenuePercentage || latestRenewal.proposedRevenue || contract.revenuePercentage,
        updatedAt: new Date(),
      };

      if ('lastModifiedById' in contract) {
        contractUpdateData.lastModifiedById = session.user.id;
      }

      const updatedContract = await tx.contract.update({
        where: { id: contractId },
        data: contractUpdateData
      });

      const renewalUpdateData: any = {
        comments: comments || 'Renewal completed successfully',
        internalNotes: `Renewal completed on ${new Date().toISOString()}`,
        updatedAt: new Date(),
      };

      if ('lastModifiedById' in latestRenewal) {
        renewalUpdateData.lastModifiedById = session.user.id;
      }

      await tx.contractRenewal.update({
        where: { id: latestRenewal.id },
        data: renewalUpdateData
      });

      return updatedContract;
    });

    revalidatePath('/contracts');
    revalidatePath(`/contracts/${contractId}`);

    return {
      success: true,
      message: 'Contract renewal completed successfully',
      contract: result,
      shouldRefresh: true
    };

  } catch (error) {
    console.error('Error completing contract renewal:', error);
    return {
      success: false,
      message: 'Failed to complete contract renewal'
    };
  }
}

export async function getContractWithLatestRenewal(contractId: string) {
  try {
    const contract = await db.contract.findUnique({
      where: { id: contractId },
      include: {
        renewals: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            attachments: {
              include: {
                uploadedBy: {
                  select: {
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        provider: { select: { name: true } },
        humanitarianOrg: { select: { name: true } },
        parkingService: { select: { name: true } },
        services: true
      }
    });

    return contract;
  } catch (error) {
    console.error('Error fetching contract with renewal:', error);
    return null;
  }
}