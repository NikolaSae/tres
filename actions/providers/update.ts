// /actions/providers/update.ts
'use server';

import { db } from '@/lib/db';
import { providerSchema, ProviderFormData } from '@/schemas/provider';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { LogSeverity } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { z } from 'zod';


export async function updateProvider(id: string, data: ProviderFormData): Promise<{ success?: boolean; id?: string; error?: string; details?: any, message?: string }> {
    const validationResult = providerSchema.safeParse(data);

    if (!validationResult.success) {
        console.error("Validation failed:", validationResult.error.format());
        return {
            error: 'Validation failed.',
            details: validationResult.error.format(),
            success: false
        };
    }

    const validatedData = validationResult.data;

    const session = await auth();
    const userId = session?.user?.id;

     if (!userId) {
       return { error: "Unauthorized", success: false };
     }


    try {
         const existingProvider = await db.provider.findUnique({
             where: { id },
             select: {
                 id: true,
                 name: true,
             }
         });

         if (!existingProvider) {
             return { error: "Provider not found.", success: false };
         }

         const duplicateProvider = await db.provider.findFirst({
              where: {
                  name: {
                      equals: validatedData.name,
                      mode: 'insensitive',
                   },
                  NOT: { id },
              },
         });

         if (duplicateProvider) {
              return { error: `Provider with name "${validatedData.name}" already exists.`, success: false };
         }


        const updatedProvider = await db.provider.update({
            where: { id },
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
            action: "PROVIDER_UPDATED",
            entityType: "provider",
            entityId: updatedProvider.id,
            details: `Provider updated: ${updatedProvider.name}`,
            userId: userId,
            severity: "INFO",
          },
        });


        revalidatePath('/providers');
        revalidatePath(`/providers/${id}`);


        return { success: true, message: 'Provider updated successfully.', id: updatedProvider.id };

    } catch (error) {
        console.error(`[PROVIDER_UPDATE_ERROR] Error updating provider with ID ${id}:`, error);

         if (error instanceof PrismaClientKnownRequestError) {
              if (error.code === 'P2002') {
                  return { error: "An provider with similar details already exists.", success: false, message: "Provider name already exists." };
              }
               if (error.code && error.clientVersion) {
                return {
                    error: "Database operation failed",
                    message: `Prisma error: ${error.code}`,
                    details: error.message,
                    success: false
                };
           }
         }

        return { error: "Failed to update provider.", success: false, message: "An unexpected error occurred." };
    }
};