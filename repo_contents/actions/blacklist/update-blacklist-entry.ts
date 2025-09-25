// actions/blacklist/update-blacklist-entry.ts
"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/security/black-log";
import { LogBlackType } from "@prisma/client";

interface UpdateBlacklistEntryData {
  id: string;
  isActive?: boolean;
  description?: string;
  effectiveDate?: Date;
}

export async function updateBlacklistEntry(data: UpdateBlacklistEntryData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Get existing data for audit log
    const oldData = await db.senderBlacklist.findUnique({
      where: { id: data.id }
    });

    if (!oldData) {
      return { success: false, error: "Entry not found" };
    }

    // Update entry
    const updatedEntry = await db.senderBlacklist.update({
      where: { id: data.id },
      data: {
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.effectiveDate && { effectiveDate: data.effectiveDate }),
        updatedAt: new Date()
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Determine action type for audit log
    const action = data.isActive !== undefined
      ? data.isActive ? LogBlackType.ACTIVATE : LogBlackType.DEACTIVATE
      : LogBlackType.UPDATE;

    // Create audit log
    await createAuditLog({
      action,
      entityId: data.id,
      userId: session.user.id,
      oldData,
      newData: updatedEntry
    });

    revalidatePath('/providers');
    return { success: true, data: updatedEntry };
  } catch (error: any) {
    console.error("Error updating blacklist entry:", error);
    return { 
      success: false, 
      error: error.message || "Failed to update blacklist entry" 
    };
  }
}