///actions/services/delete.ts

'use server'

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { logActivity } from '@/lib/security/audit-logger';

export async function deleteService(id: string) {
  const session = await auth();
  
  if (!session?.user || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }
  
  try {
    // Find the service to get the type before deletion
    const service = await prisma.service.findUnique({
      where: { id }
    });
    
    if (!service) {
      throw new Error("Service not found");
    }
    
    // Delete the service
    await prisma.service.delete({
      where: { id }
    });
    
    // Log activity
    await logActivity({
      action: 'DELETE',
      entityType: 'service',
      entityId: id,
      details: `Deleted service: ${service.name}`,
      userId: session.user.id
    });
    
    // Revalidate cache
    revalidatePath('/services');
    revalidatePath(`/services/${service.type.toLowerCase()}`);
    
    return { success: true, serviceType: service.type };
  } catch (error) {
    console.error('Failed to delete service:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}