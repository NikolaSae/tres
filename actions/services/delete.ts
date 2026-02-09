// actions/services/delete.ts
'use server'

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { logActivity } from '@/lib/security/audit-logger';

export async function deleteService(id: string) {
  const session = await auth();
  
  if (!session?.user || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }
  
  try {
    // Pronađi servis pre brisanja (da dobijemo name i type)
    const service = await db.service.findUnique({
      where: { id }
    });
    
    if (!service) {
      throw new Error("Service not found");
    }
    
    // Obriši servis
    await db.service.delete({
      where: { id }
    });
    
    // Loguj aktivnost – ispravno pozivanje sa 2 argumenta
    await logActivity('DELETE_SERVICE', {
      entityType: 'service',
      entityId: id,
      details: `Deleted service: ${service.name} (type: ${service.type})`,
      userId: session.user.id,
      // severity: LogSeverity.INFO, // opciono, ako želiš eksplicitno
    });
    
    // Revalidate putanje
    revalidatePath('/services');
    revalidatePath(`/services/${service.type.toLowerCase()}`);
    
    return { success: true, serviceType: service.type };
  } catch (error) {
    console.error('Failed to delete service:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}