// /actions/contracts/update.ts
'use server';

import { z } from 'zod';
import { ContractType } from '@prisma/client';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { logActivity } from '@/lib/security/audit-logger';
import { contractSchema } from '@/schemas/contract';

export async function updateContract(contractId: string, data: any) {
  console.log('[UPDATE_CONTRACT] Starting update for:', contractId);
  console.log('[UPDATE_CONTRACT] Data keys:', Object.keys(data || {}));
  
  try {
    let session;  
    try {
      session = await auth();
    } catch (authError) {
      console.error('[UPDATE_CONTRACT] Auth error:', authError);
      return { 
        success: false, 
        error: 'Authentication failed. Please refresh the page and try again.' 
      };
    }
    
    if (!session?.user) {
      console.log('[UPDATE_CONTRACT] No session or user');
      return { success: false, error: 'Unauthorized - please log in again' };
    }

    const userId = session.user.id;
    const userRole = session.user.role;
    
    console.log('[UPDATE_CONTRACT] Session obtained:', {
      userId,
      userRole
    });

    let validatedData;
    try {
      validatedData = contractSchema.parse(data);
    } catch (validationError) {
      console.error('[UPDATE_CONTRACT] Validation error:', validationError);
      return { 
        success: false, 
        error: 'Invalid form data. Please check all fields.' 
      };
    }
    
    const existingContract = await db.contract.findUnique({
      where: { id: contractId },
      select: { 
        id: true, 
        createdById: true,
        contractNumber: true,
        type: true,
        name: true
      }
    });
    
    if (!existingContract) {
      console.log('[UPDATE_CONTRACT] Contract not found:', contractId);
      return { success: false, error: 'Contract not found' };
    }

    console.log('[UPDATE_CONTRACT] Existing contract:', {
      id: existingContract.id,
      createdById: existingContract.createdById
    });

    const isAdmin = userRole === 'ADMIN';
    const isOwner = existingContract.createdById === userId;
    
    console.log('[UPDATE_CONTRACT] Permission check:', {
      isAdmin,
      isOwner,
      userRole,
      userId,
      contractCreatedById: existingContract.createdById
    });
    
    if (!isAdmin && !isOwner) {
      return { 
        success: false, 
        error: 'You do not have permission to edit this contract' 
      };
    }

    const sanitizedData = {
      ...validatedData,
      operatorId: validatedData.operatorId === '' ? null : validatedData.operatorId,
      providerId: validatedData.providerId === '' ? null : validatedData.providerId,
      humanitarianOrgId: validatedData.humanitarianOrgId === '' ? null : validatedData.humanitarianOrgId,
      parkingServiceId: validatedData.parkingServiceId === '' ? null : validatedData.parkingServiceId,
    };

    const { services: servicesData, ...restValidatedData } = sanitizedData;

    const dbData = {
      ...restValidatedData,
      providerId: restValidatedData.type === ContractType.PROVIDER ? restValidatedData.providerId : null,
      humanitarianOrgId: restValidatedData.type === ContractType.HUMANITARIAN ? restValidatedData.humanitarianOrgId : null,
      parkingServiceId: restValidatedData.type === ContractType.PARKING ? restValidatedData.parkingServiceId : null,
      operatorId: restValidatedData.isRevenueSharing ? restValidatedData.operatorId : null,
      operatorRevenue: restValidatedData.isRevenueSharing ? restValidatedData.operatorRevenue : 0,
      updatedAt: new Date(),
    };

    const updatedContract = await db.$transaction(async (tx) => {
      const validateReference = async (id: string | null | undefined, model: string) => {
        if (!id) return;
        const exists = await (tx as any)[model].findUnique({ where: { id } });
        if (!exists) throw new Error(`Invalid ${model} reference: ${id}`);
      };

      await validateReference(dbData.operatorId, 'operator');
      await validateReference(dbData.providerId, 'provider');
      await validateReference(dbData.humanitarianOrgId, 'humanitarianOrg');
      await validateReference(dbData.parkingServiceId, 'parkingService');

      if (Array.isArray(servicesData)) {
        await tx.serviceContract.deleteMany({
          where: { contractId }
        });
        
        if (servicesData.length > 0) {
          await tx.serviceContract.createMany({
            data: servicesData.map((service: any) => ({
              contractId,
              serviceId: service.serviceId,
              specificTerms: service.specificTerms || null
            }))
          });
        }
      }
      
      return await tx.contract.update({
        where: { id: contractId },
        data: dbData,
        include: {
          services: {
            include: {
              service: true
            }
          },
          provider: true,
          operator: true,
          humanitarianOrg: true,
          parkingService: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
    });

    console.log('[UPDATE_CONTRACT] Contract updated successfully:', updatedContract.id);

    try {
      await logActivity({
        action: 'UPDATE',
        entityType: 'contract',
        entityId: updatedContract.id,
        details: `Updated contract: ${updatedContract.name}`,
        userId
      });
    } catch (logError) {
      console.warn('[UPDATE_CONTRACT] Failed to log activity:', logError);
    }

    try {
      revalidatePath('/contracts');
      revalidatePath(`/contracts/${contractId}`);
      revalidatePath(`/contracts/${contractId}/edit`);
    } catch (revalidateError) {
      console.warn('[UPDATE_CONTRACT] Failed to revalidate paths:', revalidateError);
    }

    console.log('[UPDATE_CONTRACT] Success - returning result');
    return { 
      success: true, 
      contractId: updatedContract.id,
      message: 'Contract updated successfully'
    };
    
  } catch (error: any) {
    console.error('[UPDATE_CONTRACT] Unexpected error:', error);
    
    if (error.code === 'P2002') {
      return { 
        success: false, 
        error: 'Contract number already exists. Please use a different number.' 
      };
    }
    
    if (error.code === 'P2003') {
      const constraintMap: Record<string, string> = {
        'Contract_operatorId_fkey': 'Operator',
        'Contract_providerId_fkey': 'Provider',
        'Contract_humanitarianOrgId_fkey': 'Humanitarian Organization',
        'Contract_parkingServiceId_fkey': 'Parking Service'
      };

      const entityName = error.meta?.constraint 
        ? constraintMap[error.meta.constraint] || 'reference' 
        : 'reference';

      return { 
        success: false, 
        error: `Invalid ${entityName} selected. Please choose a valid option.` 
      };
    }
    
    if (error.code === 'P2025') {
      return { 
        success: false, 
        error: 'Contract not found' 
      };
    }
    
    if (error.message?.includes('Invalid reference:')) {
      return { 
        success: false, 
        error: error.message.replace('Invalid', 'Invalid or inactive')
      };
    }
    
    return { 
      success: false, 
      error: 'Failed to update contract. Please try again.' 
    };
  }
}