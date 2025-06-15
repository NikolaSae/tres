// Path: /actions/humanitarian-orgs/update.ts
'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { LogSeverity } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { humanitarianOrgSchema, HumanitarianOrgFormData } from '@/schemas/humanitarian-org';
import { z } from 'zod';


export const updateHumanitarianOrg = async (id: string, values: HumanitarianOrgFormData) => {
    const validatedFields = humanitarianOrgSchema.safeParse(values);

    if (!validatedFields.success) {
        console.error("Validation failed:", validatedFields.error.errors);
        return { error: "Invalid fields!", details: validatedFields.error.format(), success: false };
    }

    const {
        name,
        contactPerson,
        email,
        phone,
        address,
        website,
        mission,
        isActive,
    } = validatedFields.data;

    const session = await auth();
    const userId = session?.user?.id;

     if (!userId) {
       return { error: "Unauthorized", success: false };
     }


    try {
         const existingOrganization = await db.humanitarianOrg.findUnique({
             where: { id },
         });

         if (!existingOrganization) {
             return { error: "Humanitarian organization not found.", success: false };
         }

         const orgWithSameName = await db.humanitarianOrg.findFirst({
              where: {
                  name: name,
                  id: { not: id },
              },
         });
         if (orgWithSameName) {
              return { error: `Another organization with name "${name}" already exists.`, success: false };
         }

          if (email && email !== existingOrganization.email) {
              const orgWithSameEmail = await db.humanitarianOrg.findUnique({
                 where: { email: email },
              });
              if (orgWithSameEmail) {
                  return { error: `Another organization with email "${email}" already exists.`, success: false };
              }
          }


        const updatedOrganization = await db.humanitarianOrg.update({
            where: { id },
            data: {
                name,
                contactPerson,
                email,
                phone,
                address,
                website,
                mission,
                isActive,
            },
        });

        await db.activityLog.create({
          data: {
            action: "HUMANITARIAN_ORG_UPDATED",
            entityType: "humanitarian_org",
            entityId: updatedOrganization.id,
            details: `Humanitarian Organization updated: ${updatedOrganization.name}`,
            userId: userId,
            severity: "INFO",
          },
        });

        revalidatePath('/humanitarian-orgs');
        revalidatePath(`/humanitarian-orgs/${id}`);
        revalidatePath(`/humanitarian-orgs/${id}/edit`);


        return { success: true, message: "Humanitarian organization updated successfully!", id: updatedOrganization.id };

    } catch (error) {
        console.error(`[HUMANITARIAN_ORG_UPDATE_ERROR] Error updating humanitarian organization ${id}:`, error);

         if (error instanceof PrismaClientKnownRequestError) {
              if (error.code === 'P2002') {
                  return { error: "An organization with similar details already exists.", success: false };
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

        return { error: "Failed to update humanitarian organization.", success: false };
    }
};