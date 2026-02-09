// /actions/providers/create.ts
'use server';

import { db } from '@/lib/db';
import { providerSchema, ProviderFormData } from '@/schemas/provider';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { LogSeverity } from '@prisma/client';

// Fixed return type - removed duplicate 'success'
export async function createProvider(data: ProviderFormData): Promise<{ 
  success: boolean; 
  id?: string; 
  error?: string; 
  message?: string;
  details?: any;
}> {
    const validationResult = providerSchema.safeParse(data);

    if (!validationResult.success) {
        console.error("Validation failed:", validationResult.error.format());
        return {
            success: false,
            error: 'Validation failed.',
            details: validationResult.error.format(),
        };
    }

    const validatedData = validationResult.data;

    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
         return { 
           success: false,
           error: "Unauthorized" 
         };
    }

    try {
        const existingProvider = await db.provider.findFirst({
            where: {
                name: {
                    equals: validatedData.name,
                    mode: 'insensitive',
                },
            },
        });

        if (existingProvider) {
            return { 
              success: false,
              error: `Provider with name "${validatedData.name}" already exists.` 
            };
        }

        const provider = await db.provider.create({
            data: {
                name: validatedData.name,
                contactName: validatedData.contactName || null,
                email: validatedData.email || null,
                phone: validatedData.phone || null,
                address: validatedData.address || null,
                isActive: validatedData.isActive,
                imageUrl: validatedData.imageUrl || null,
            },
        });

        await db.activityLog.create({
          data: {
            action: "PROVIDER_CREATED",
            entityType: "provider",
            entityId: provider.id,
            details: `Provider created: ${provider.name}`,
            userId: userId,
            severity: LogSeverity.INFO, // Use enum instead of string
          },
        });

        revalidatePath('/providers');
        revalidatePath(`/providers/${provider.id}`);

        return { 
          success: true, 
          message: 'Provider created successfully.', 
          id: provider.id 
        };

    } catch (error) {
        console.error("[PROVIDER_CREATE_ERROR] Error creating provider:", error);

        if (error instanceof Error) {
           const prismaError = error as any;
           if (prismaError.code === 'P2002') {
             return {
                success: false,
                error: "Data conflict",
                message: "A provider with this name already exists.",
                details: prismaError.meta?.target,
             };
           }
           if (prismaError.code && prismaError.clientVersion) {
                return {
                    success: false,
                    error: "Database operation failed",
                    message: `Prisma error: ${prismaError.code}`,
                    details: prismaError.message,
                };
           }
        }

        return { 
          success: false,
          error: 'Failed to create provider.', 
          message: "An unexpected error occurred." 
        };
    }
}