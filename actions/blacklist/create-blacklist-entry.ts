// actions/blacklist/create-blacklist-entry.ts
"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/security/black-log";
import { LogBlackType } from "@prisma/client";

interface CreateBlacklistEntryData {
  senderName: string;
  effectiveDate: Date;
  description?: string;
  isActive?: boolean;
}

export async function createBlacklistEntry(data: CreateBlacklistEntryData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Check for existing entry
    const existingEntry = await db.senderBlacklist.findFirst({
      where: { senderName: data.senderName }
    });

    if (existingEntry) {
      return { 
        success: false, 
        error: `Blacklist entry already exists for sender: ${data.senderName}` 
      };
    }

    // Create entry
    const blacklistEntry = await db.senderBlacklist.create({
      data: {
        senderName: data.senderName,
        effectiveDate: data.effectiveDate,
        description: data.description,
        isActive: data.isActive ?? true,
        createdById: session.user.id
      },
      include: {
        createdBy: {
          select: { id: true, name: true }
        }
      }
    });

    // Create audit log
    await createAuditLog({
      action: LogBlackType.CREATE,
      entityId: blacklistEntry.id,
      userId: session.user.id,
      newData: blacklistEntry
    });

    revalidatePath('/providers');
    
    return { 
      success: true, 
      data: blacklistEntry,
      message: `Blacklist entry created for sender: ${data.senderName}`
    };
  } catch (error: any) {
    console.error("Error creating blacklist entry:", error);
    return { 
      success: false, 
      error: error.message || "Failed to create blacklist entry" 
    };
  }
}