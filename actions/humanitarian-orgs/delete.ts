// Path: /actions/humanitarian-orgs/delete.ts
'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { LogSeverity } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';


export const deleteHumanitarianOrg = async (id: string) => {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        return { error: "Unauthorized", success: false };
    }

    try {
        const existingOrganization = await db.humanitarianOrg.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
            }
        });

        if (!existingOrganization) {
            return { error: "Humanitarian organization not found.", success: false };
        }

        await db.humanitarianOrg.delete({
            where: { id },
        });

        await db.activityLog.create({
          data: {
            action: "HUMANITARIAN_ORG_DELETED",
            entityType: "humanitarian_org",
            entityId: existingOrganization.id,
            details: `Humanitarian Organization deleted: ${existingOrganization.name}`,
            userId: userId,
            severity: "INFO",
          },
        });

        revalidatePath('/humanitarian-orgs');
        // revalidatePath(`/humanitarian-orgs/${existingOrganization.id}`); // Opciono revalidiraj stranicu specificne org ako postoji

        return { success: true, message: "Humanitarian organization deleted successfully!" };

    } catch (error) {
        console.error(`[HUMANITARIAN_ORG_DELETE_ERROR] Error deleting humanitarian organization ${id}:`, error);

        if (error instanceof PrismaClientKnownRequestError) {
             if (error.code === 'P2003') {
                 return { error: "Cannot delete humanitarian organization because it is associated with existing records.", success: false };
             }
        }
        return { error: "Failed to delete humanitarian organization.", success: false };
    }
};