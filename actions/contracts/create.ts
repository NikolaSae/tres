// actions/contracts/create.ts
'use server';

import { db } from '@/lib/db';
import { contractSchema } from '@/schemas/contract';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import type { ContractFormData } from '@/schemas/contract';
import { ContractType } from '@prisma/client';

export async function createContract(data: ContractFormData) {
  try {
    console.log("[CREATE_CONTRACT] Received data:", {
      ...data,
      startDate: data.startDate,
      endDate: data.endDate,
      operatorId: data.operatorId,
      operatorRevenue: data.operatorRevenue,
      isRevenueSharing: data.isRevenueSharing,
      services: data.services?.length
    });

    const validContractTypes = Object.values(ContractType);
    if (!validContractTypes.includes(data.type)) {
      return {
        error: "Invalid contract type",
        details: `Received: ${data.type}, Valid types: ${validContractTypes.join(', ')}`,
        success: false
      };
    }

    const validationResult = contractSchema.safeParse(data);
    if (!validationResult.success) {
      console.error("[CREATE_CONTRACT] Validation failed:", validationResult.error);
      return {
        error: "Validation failed",
        details: validationResult.error.flatten(),
        success: false
      };
    }

    const dbData = {
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      revenuePercentage: Number(data.revenuePercentage),
      operatorRevenue: data.isRevenueSharing ? Number(data.operatorRevenue) : 0,
      providerId: data.type === ContractType.PROVIDER ? data.providerId : null,
      humanitarianOrgId: data.type === ContractType.HUMANITARIAN ? data.humanitarianOrgId : null,
      parkingServiceId: data.type === ContractType.PARKING ? data.parkingServiceId : null,
    };

    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized", success: false };
    }

    const existingContract = await db.contract.findUnique({
      where: { contractNumber: dbData.contractNumber },
    });

    if (existingContract) {
      return {
        error: "Contract number already exists",
        success: false,
        existingId: existingContract.id
      };
    }

    // Determine operatorId value based on revenue sharing status
    const operatorIdValue = 
      dbData.isRevenueSharing && 
      dbData.operatorId && 
      typeof dbData.operatorId === 'string' && 
      dbData.operatorId.trim() !== ''
        ? dbData.operatorId
        : null;

    // Build contract data explicitly
    const contractData: any = {
      name: dbData.name,
      contractNumber: dbData.contractNumber,
      type: dbData.type,
      status: dbData.status,
      startDate: dbData.startDate,
      endDate: dbData.endDate,
      revenuePercentage: dbData.revenuePercentage,
      description: dbData.description,
      operatorRevenue: dbData.operatorRevenue,
      isRevenueSharing: dbData.isRevenueSharing,
      operatorId: operatorIdValue,
      providerId: dbData.providerId,
      humanitarianOrgId: dbData.humanitarianOrgId,
      parkingServiceId: dbData.parkingServiceId,
      createdById: session.user.id,
    };

    // Create contract first
    const newContract = await db.contract.create({
      data: contractData,
      include: {
        services: true,
        provider: true,
        humanitarianOrg: true,
        parkingService: true,
        operator: true,
        createdBy: true,
      }
    });

    // Then create service contracts
    if (dbData.services && dbData.services.length > 0) {
      await db.serviceContract.createMany({
        data: dbData.services.map(service => ({
          contractId: newContract.id,
          serviceId: service.serviceId,
          specificTerms: service.specificTerms || null
        }))
      });
    }

    await db.activityLog.create({
      data: {
        action: "CONTRACT_CREATED",
        entityType: "contract",
        entityId: newContract.id,
        details: `Contract created: ${newContract.contractNumber} - ${newContract.name}`,
        userId: session.user.id,
        severity: "INFO",
      },
    });

    revalidatePath('/contracts');
    revalidatePath(`/contracts/${newContract.id}`);

    return {
      success: true,
      message: "Contract created successfully",
      id: newContract.id,
      contract: newContract
    };

  } catch (error: any) {
    console.error("[CONTRACT_CREATE_ERROR]", error);

    if (error.code === 'P2002') {
      return {
        error: "Data conflict",
        message: "A record with this unique field already exists.",
        details: error.meta?.target,
        success: false
      };
    }

    if (error.code === 'P2003') {
      return {
        error: "Invalid reference",
        message: "One of the linked items does not exist.",
        details: error.meta?.field_name,
        success: false
      };
    }

    return {
      error: "An unexpected error occurred",
      message: error.message || "Failed to create contract",
      success: false
    };
  }
}