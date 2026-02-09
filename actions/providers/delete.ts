// Path: /actions/providers/delete.ts
'use server';

import { db } from '@/lib/db';
import { auth } from '@/auth';
import { currentRole } from "@/lib/auth";
import { UserRole, LogSeverity } from "@prisma/client";
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { revalidatePath } from 'next/cache';

// Fixed return type to include details
export async function deleteProvider(id: string): Promise<{ 
  success: boolean; 
  error?: string; 
  message?: string;
  details?: any;
}> {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
         return { 
           success: false,
           error: "Unauthorized" 
         };
    }

    const role = await currentRole();
    if (role !== UserRole.ADMIN) {
       return { 
         success: false,
         error: "Forbidden" 
       };
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
            return { 
              success: false,
              error: `Provider with ID ${id} not found.`, 
              message: "Provider not found." 
            };
        }

        await db.provider.delete({
            where: { id },
        });

        await db.activityLog.create({
          data: {
            action: "PROVIDER_DELETED",
            entityType: "provider",
            entityId: existingProvider.id,
            details: `Provider deleted: ${existingProvider.name}`,
            userId: userId,
            severity: LogSeverity.INFO, // Use enum instead of string
          },
        });

        revalidatePath('/providers');
        revalidatePath(`/providers/${existingProvider.id}`);

        return { 
          success: true, 
          message: "Provider deleted successfully!" 
        };

    } catch (error) {
        console.error(`[PROVIDER_DELETE_ERROR] Error deleting provider with ID ${id}:`, error);

        if (error instanceof PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                return { 
                  success: false,
                  error: `Provider with ID ${id} not found.`, 
                  message: "Provider not found." 
                };
            }
            if (error.code === 'P2003') {
                return { 
                  success: false,
                  error: `Cannot delete provider because it is associated with other records.`, 
                  message: "Provider is in use and cannot be deleted." 
                };
            }
            if (error.code && error.clientVersion) {
                return {
                    success: false,
                    error: "Database operation failed",
                    message: `Prisma error: ${error.code}`,
                    details: error.message,
                };
            }
        }

        return { 
          success: false,
          error: "Failed to delete provider.", 
          message: "An unexpected error occurred." 
        };
    }
}