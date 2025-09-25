//actions/log/updateLogStatus.ts

"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { LogStatus } from "@prisma/client";
import { z } from "zod";

const updateLogStatusSchema = z.object({
  id: z.string(),
  status: z.nativeEnum(LogStatus),
});

export type UpdateLogStatusInput = z.infer<typeof updateLogStatusSchema>;

interface UpdateLogStatusResult {
    success: boolean;
    data?: {
        id: string;
        status: LogStatus;
    };
    error?: string;
}

export async function updateLogStatus(
  params: UpdateLogStatusInput
): Promise<UpdateLogStatusResult> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const validatedParams = updateLogStatusSchema.safeParse(params);

    if (!validatedParams.success) {
      console.error("Update log status validation failed:", validatedParams.error.errors);
      return { success: false, error: "Invalid input parameters." };
    }

    const { id, status } = validatedParams.data;

    const updatedLog = await db.logEntry.update({
      where: { id },
      data: {
        status: status,
        updatedAt: new Date(),
        updatedById: currentUser.id, // Postavljamo updatedById na ID trenutnog korisnika
      },
      select: {
          id: true,
          status: true,
      }
    });

    return {
        success: true,
        data: {
            id: updatedLog.id,
            status: updatedLog.status,
        }
    };

  } catch (error) {
    console.error("[UPDATE_LOG_STATUS_ERROR]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update log status.",
    };
  }
}
