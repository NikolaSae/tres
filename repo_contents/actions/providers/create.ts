// /actions/providers/create.ts
'use server';

import { db } from '@/lib/db';
import { providerSchema, ProviderFormData } from '@/schemas/provider';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { LogSeverity } from '@prisma/client';
import { z } from 'zod';

export async function createProvider(data: ProviderFormData): Promise<{ success?: string; id?: string; error?: string; details?: any, success: boolean, message?: string }> {
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
        const existingProvider = await db.provider.findFirst({
            where: {
                name: {
                    equals: validatedData.name,
                    mode: 'insensitive',
                },
            },
        });

        if (existingProvider) {
            return { error: `Provider with name "${validatedData.name}" already exists.`, success: false };
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
            severity: "INFO",
          },
        });

        revalidatePath('/providers');
        revalidatePath(`/providers/${provider.id}`);

        return { success: true, message: 'Provider created successfully.', id: provider.id };

    } catch (error) {
        console.error("[PROVIDER_CREATE_ERROR] Error creating provider:", error);

        if (error instanceof Error) {
           const prismaError = error as any;
           if (prismaError.code === 'P2002') {
             return {
                error: "Data conflict",
                message: "A provider with this name already exists.",
                details: prismaError.meta?.target,
                success: false
             };
           }
           if (prismaError.code && prismaError.clientVersion) {
                return {
                    error: "Database operation failed",
                    message: `Prisma error: ${prismaError.code}`,
                    details: prismaError.message,
                    success: false
                };
           }
        }


        return { error: 'Failed to create provider.', success: false, message: "An unexpected error occurred." };
    }
}