// Path: /actions/humanitarian-orgs/create.ts
'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { LogSeverity } from '@prisma/client';
import { humanitarianOrgSchema, HumanitarianOrgFormData } from '@/schemas/humanitarian-org';
import { z } from 'zod';


export const createHumanitarianOrg = async (values: HumanitarianOrgFormData) => {
    const validatedFields = humanitarianOrgSchema.safeParse(values);

    if (!validatedFields.success) {
        console.error("Validation failed:", validatedFields.error.errors);
        return { error: "Invalid fields!", details: validatedFields.error.format(), success: false };
    }

    const validatedData = validatedFields.data;

    const session = await auth();
    if (!session?.user || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
        return { error: "Unauthorized", success: false };
    }

    try {
        const existingOrgByName = await db.humanitarianOrg.findUnique({
            where: { name: validatedData.name },
        });
        if (existingOrgByName) {
            return { error: `Organization with name "${validatedData.name}" already exists.`, success: false };
        }

        if (validatedData.email) {
            const existingOrgByEmail = await db.humanitarianOrg.findFirst({
                where: { email: validatedData.email },
            });
            if (existingOrgByEmail) {
                return { error: `Organization with email "${validatedData.email}" already exists.`, success: false };
            }
        }

        const newOrganization = await db.humanitarianOrg.create({
            data: {
                name: validatedData.name,
                contactName: validatedData.contactPerson ?? null,
                email: validatedData.email ?? null,
                phone: validatedData.phone ?? null,
                address: validatedData.address ?? null,
                website: validatedData.website ?? null,
                mission: validatedData.mission ?? null,
                isActive: validatedData.isActive ?? true,
                pib: validatedData.pib ?? null,
                registrationNumber: validatedData.registrationNumber ?? null,
                bank: validatedData.bank ?? null,
                accountNumber: validatedData.accountNumber ?? null,
                shortNumber: validatedData.shortNumber ?? null,
            },
        });

        await db.activityLog.create({
          data: {
            action: "HUMANITARIAN_ORG_CREATED",
            entityType: "humanitarian_org",
            entityId: newOrganization.id,
            details: `Humanitarian Organization created: ${newOrganization.name}`,
            userId: session.user.id,
            severity: "INFO",
          },
        });

        revalidatePath('/humanitarian-orgs');

        return { success: true, message: "Humanitarian organization created successfully!", id: newOrganization.id };

    } catch (error) {
        console.error("[HUMANITARIAN_ORG_CREATE_ERROR]", error);

        if (error instanceof z.ZodError) {
           const formattedErrors = error.format();
           return {
             error: "Invalid input data",
             formErrors: formattedErrors,
             success: false
           };
        }

        if (error instanceof Error) {
           const prismaError = error as any;

           if (prismaError.code === 'P2002') {
             return {
                error: "Data conflict",
                message: "An organization with similar details already exists.",
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

        return { error: "An unexpected error occurred", message: "Failed to create humanitarian organization.", details: error instanceof Error ? error.message : "Unknown error", success: false };
    }
};