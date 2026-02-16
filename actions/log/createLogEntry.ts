// actions/log/createLogEntry.ts
"use server";

import { revalidatePath } from 'next/cache';
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { LogActionType, LogStatus, LogEntityType } from "@prisma/client";
import { z } from "zod";

const createLogEntrySchema = z.object({
  entityType: z.nativeEnum(LogEntityType),
  entityId: z.string().min(1, "Entity ID is required"),
  action: z.nativeEnum(LogActionType),
  subject: z.string().min(1, "Subject is required").max(255, "Subject is too long"),
  description: z.string().max(1000, "Description is too long").optional().nullable(),
  sendEmail: z.boolean().default(false),
  status: z.nativeEnum(LogStatus).default(LogStatus.IN_PROGRESS),
  providerId: z.string().optional().nullable(),
  parkingServiceId: z.string().optional().nullable(),
  bulkServiceId: z.string().optional().nullable(),
});

export type CreateLogEntryInput = z.infer<typeof createLogEntrySchema>;

export async function createLogEntry(
  data: CreateLogEntryInput
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // Authenticate
    const currentUser = await getCurrentUser();
    
    if (!currentUser || !currentUser.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate
    const validatedData = createLogEntrySchema.safeParse(data);
    if (!validatedData.success) {
      console.error("Log entry validation failed:", validatedData.error.errors);
      return { success: false, error: "Invalid input data." };
    }

    const { 
      entityType, 
      entityId, 
      action, 
      subject, 
      description, 
      sendEmail, 
      status, 
      ...entityIds 
    } = validatedData.data;

    // Prepare data
    const logData: any = {
      entityType,
      entityId,
      action,
      subject,
      description,
      sendEmail,
      status,
      createdById: currentUser.id,
    };

    // Set correct foreign key based on entityType
    switch (entityType) {
      case LogEntityType.PROVIDER:
        if (entityIds.providerId !== entityId) {
          return { success: false, error: "Provider ID mismatch." };
        }
        logData.providerId = entityId;
        break;
      case LogEntityType.PARKING_SERVICE:
        if (entityIds.parkingServiceId !== entityId) {
          return { success: false, error: "Parking Service ID mismatch." };
        }
        logData.parkingServiceId = entityId;
        break;
      case LogEntityType.BULK_SERVICE:
        if (entityIds.bulkServiceId !== entityId) {
          return { success: false, error: "Bulk Service ID mismatch." };
        }
        logData.bulkServiceId = entityId;
        break;
      default:
        return { success: false, error: "Unsupported entity type." };
    }

    // Create log entry
    const newLogEntry = await db.logEntry.create({
      data: logData,
    });

    // ✅ Invaliduj cache posle kreiranja
    revalidatePath('/logs');
    revalidatePath('/dashboard');

    // Optional: Email sending logic
    // if (sendEmail) { ... }

    return { success: true, data: newLogEntry };
  } catch (error) {
    console.error("[CREATE_LOG_ENTRY_ERROR]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create log entry.",
    };
  }
}