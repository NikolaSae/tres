// actions/blacklist/delete-blacklist-entry.ts
"use server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath, updateTag } from "next/cache";
import { createAuditLog } from "@/lib/security/black-log";
import { LogBlackType } from "@prisma/client";

export async function deleteBlacklistEntry(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const oldData = await db.senderBlacklist.findUnique({ where: { id } });
    if (!oldData) {
      return { success: false, error: "Entry not found" };
    }

    // Audit log pre brisanja (dok entitet još postoji)
    await createAuditLog({
      action: LogBlackType.DELETE,
      entityId: id,
      userId: session.user.id,
      oldData
    });

    await db.senderBlacklist.delete({ where: { id } });

    updateTag('blacklist-logs');
    revalidatePath('/providers');

    return { success: true };
  } catch (error: unknown) {
    console.error("Error deleting blacklist entry:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete blacklist entry"
    };
  }
}