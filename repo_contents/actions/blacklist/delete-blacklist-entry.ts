// actions/blacklist/delete-blacklist-entry.ts
"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/security/black-log";
import { LogBlackType } from "@prisma/client";

export async function deleteBlacklistEntry(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Get existing data for audit log
    const oldData = await db.senderBlacklist.findUnique({
      where: { id }
    });

    if (!oldData) {
      return { success: false, error: "Entry not found" };
    }

    // Create audit log for deletion
    await createAuditLog({
      action: LogBlackType.DELETE,
      entityId: id,
      userId: session.user.id,
      oldData
    });

    // Delete the SenderBlacklist entry
    // Related BlacklistLog entries will automatically have their entityId set to NULL
    await db.senderBlacklist.delete({
      where: { id }
    });

    revalidatePath('/providers');
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting blacklist entry:", error);
    return { 
      success: false, 
      error: error.message || "Failed to delete blacklist entry" 
    };
  }
}