///actions/services/update.ts

'use server'
import { z } from 'zod';
import { contractSchema } from '@/schemas/contract';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { logActivity } from '@/lib/security/audit-logger';

export async function updateContract(id: string, formData: any) {
  console.log('[UPDATE_CONTRACT] Starting update for:', id);
  console.log('[UPDATE_CONTRACT] Data keys:', Object.keys(formData));
  
  try {
    // Dobij session bez pozivanja headers direktno
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

    // Ažuriraj ugovor
    const updatedContract = await db.contract.update({
      where: { id },
      data: {
        name: validatedData.name,
        contractNumber: validatedData.contractNumber,
        type: validatedData.type,
        status: validatedData.status,
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
        services: validatedData.services
      }
    });

    // Log aktivnost
    await logActivity({
      action: 'UPDATE',
      entityType: 'contract',
      entityId: updatedContract.id,
      details: `Updated contract: ${updatedContract.name}`,
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
      where: { id }
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

    // Log activity
    await logActivity({
      action: 'UPDATE',
      entityType: 'service',
      entityId: updatedService.id,
      details: `Updated service: ${updatedService.name}`,
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
    return { error: 'Failed to update service' };
  }
}