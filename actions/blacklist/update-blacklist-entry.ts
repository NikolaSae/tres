// actions/blacklist/update-blacklist-entry.ts
"use server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath, updateTag } from "next/cache";
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

    const oldData = await db.senderBlacklist.findUnique({ where: { id: data.id } });
    if (!oldData) {
      return { success: false, error: "Entry not found" };
    }

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
          select: { id: true, name: true }
        }
      }
    });

    const action = data.isActive !== undefined
      ? data.isActive ? LogBlackType.ACTIVATE : LogBlackType.DEACTIVATE
      : LogBlackType.UPDATE;

    await createAuditLog({
      action,
      entityId: data.id,
      userId: session.user.id,
      oldData,
      newData: updatedEntry
    });

    updateTag('blacklist-logs');
    revalidatePath('/providers');

    return { success: true, data: updatedEntry };
  } catch (error: unknown) {
    console.error("Error updating blacklist entry:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update blacklist entry"
    };
  }
}