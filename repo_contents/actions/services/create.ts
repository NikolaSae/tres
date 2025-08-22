// actions/services/create.ts
'use server'

import { z } from 'zod';
import { serviceSchema } from '@/schemas/service';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { ServiceType } from '@prisma/client';
import { logActivity } from '@/lib/security/audit-logger';

export async function createService(formData: z.infer<typeof serviceSchema>) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  
  try {
    // Validate form data
    const validatedData = serviceSchema.parse(formData);
    
    // Create the service
    const service = await db.service.create({
      data: {
        name: validatedData.name,
        type: validatedData.type as ServiceType,
        description: validatedData.description,
        isActive: validatedData.isActive
      }
    });
    
    // Log activity - Fixed function call
    await logActivity("CREATE", {
      entityType: 'service',
      entityId: service.id,
      details: `Created service: ${service.name}`,
      userId: session.user.id
    });
    
    // Revalidate cache
    revalidatePath('/services');
    revalidatePath(`/services/${service.type.toLowerCase()}`);
    
    return { success: true, serviceId: service.id, serviceType: service.type };
  } catch (error) {
    console.error('Failed to create service:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Fixed logActivity function - Note the userId parameter should be part of options