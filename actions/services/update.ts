// actions/services/update.ts
'use server'

import { z } from 'zod';
import { contractSchema } from '@/schemas/contract';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { logActivity } from '@/lib/security/audit-logger';
import { ContractStatus } from '@prisma/client';
import { serviceSchema, ServiceFormData } from '@/schemas/service';

export async function updateContract(id: string, formData: any) {
  console.log('[UPDATE_CONTRACT] Starting update for:', id);
  console.log('[UPDATE_CONTRACT] Data keys:', Object.keys(formData));
  
  try {
    const session = await auth();
    
    if (!session?.user) {
      console.log('[UPDATE_CONTRACT] No session or user');
      return { success: false, error: 'Unauthorized' };
    }

    console.log('[UPDATE_CONTRACT] Session user:', {
      id: session.user.id,
      role: session.user.role
    });

    // Validacija podataka
    const validatedData = contractSchema.parse(formData);
    
    // Pronađi postojeći ugovor
    const existingContract = await db.contract.findUnique({
      where: { id }
    });
    
    if (!existingContract) {
      return { success: false, error: 'Contract not found' };
    }

    // Proveri dozvole
    const isAdmin = session.user.role === 'ADMIN';
    const isOwner = existingContract.createdById === session.user.id;
    
    if (!isAdmin && !isOwner) {
      return { success: false, error: 'Insufficient permissions' };
    }

    // Pripremi status – konvertuj string u enum vrednost
    let statusEnum: ContractStatus | undefined = undefined;
    if (validatedData.status) {
      const upperStatus = validatedData.status.toUpperCase().replace(/-/g, '_');
      if (upperStatus in ContractStatus) {
        statusEnum = ContractStatus[upperStatus as keyof typeof ContractStatus];
      } else {
        return { success: false, error: `Invalid status value: ${validatedData.status}` };
      }
    }

    // Ažuriraj ugovor – koristi nested write za services relaciju
    const updatedContract = await db.contract.update({
      where: { id },
      data: {
        name: validatedData.name,
        contractNumber: validatedData.contractNumber,
        type: validatedData.type,
        status: statusEnum,
        startDate: validatedData.startDate,
        endDate: validatedData.endDate,
        revenuePercentage: validatedData.revenuePercentage,
        description: validatedData.description,
        providerId: validatedData.providerId,
        humanitarianOrgId: validatedData.humanitarianOrgId,
        parkingServiceId: validatedData.parkingServiceId,
        operatorId: validatedData.operatorId,
        isRevenueSharing: validatedData.isRevenueSharing,
        operatorRevenue: validatedData.operatorRevenue,
        
        // Ispravljeno: nested write za services (delete old, create new)
        services: validatedData.services ? {
          deleteMany: {},  // obriši sve stare veze
          create: validatedData.services.map(s => ({
            serviceId: s.serviceId,
            specificTerms: s.specificTerms || null
          }))
        } : undefined,
      }
    });

    // Log aktivnost – ispravno pozivanje sa 2 argumenta
    await logActivity('UPDATE_CONTRACT', {
      entityType: 'contract',
      entityId: updatedContract.id,
      details: `Updated contract: ${updatedContract.name} (status: ${updatedContract.status})`,
      userId: session.user.id
    });

    // Revalidate cache
    revalidatePath('/contracts');
    revalidatePath(`/contracts/${id}`);
    revalidatePath(`/contracts/${id}/edit`);

    console.log('[UPDATE_CONTRACT] Success');
    return { success: true, contractId: updatedContract.id };
    
  } catch (error) {
    console.error('[UPDATE_CONTRACT] Error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update contract' 
    };
  }
}

export async function updateService(id: string, values: ServiceFormData) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: 'Unauthorized' };
    }

    // Validate input data
    const validatedData = serviceSchema.parse(values);

    // Find existing service
    const existingService = await db.service.findUnique({
      where: { id },
      select: {
    id: true,
    name: true,
    type: true,
    description: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
    billingType: true,
    createdById: true,          // ← DODATO OVO
    // ako ti treba i createdBy objekat:
    // createdBy: { select: { id: true, name: true } }
  }
    });

    if (!existingService) {
      return { error: 'Service not found' };
    }

    // Check permissions
    const isAdmin = session.user.role === 'ADMIN';
    const isOwner = existingService.createdById === session.user.id;

    if (!isAdmin && !isOwner) {
      return { error: 'Insufficient permissions' };
    }

    // Update service
    const updatedService = await db.service.update({
      where: { id },
      data: {
        name: validatedData.name,
        type: validatedData.type,
        description: validatedData.description,
        isActive: validatedData.isActive,
        updatedAt: new Date(),
      }
    });

    // Log activity – ispravno pozivanje sa 2 argumenta
    await logActivity('UPDATE_SERVICE', {
      entityType: 'service',
      entityId: updatedService.id,
      details: `Updated service: ${updatedService.name} (type: ${updatedService.type})`,
      userId: session.user.id
    });

    // Revalidate cache
    revalidatePath('/services');
    revalidatePath(`/services/${id}`);
    revalidatePath(`/services/${id}/edit`);

    return { success: `Service "${updatedService.name}" updated successfully!` };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        error: 'Validation error', 
        details: error.errors.map(e => e.message) 
      };
    }
    console.error('[UPDATE_SERVICE] Error:', error);
    return { error: 'Failed to update service' };
  }
}