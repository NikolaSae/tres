//actions/log/createLogEntry.ts

"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { LogActionType, LogStatus, LogEntityType } from "@prisma/client"; // Import enums from Prisma client
import { z } from "zod"; // Assuming you use Zod for validation
// import { sendEmailToProvider } from "@/lib/email"; // Assuming you have an email sending utility

// Define the Zod schema for validating the input data
const createLogEntrySchema = z.object({
  entityType: z.nativeEnum(LogEntityType), // Must be one of the defined entity types
  entityId: z.string().min(1, "Entity ID is required"), // The ID of the specific entity

  action: z.nativeEnum(LogActionType), // Must be one of the defined action types
  subject: z.string().min(1, "Subject is required").max(255, "Subject is too long"),
  description: z.string().max(1000, "Description is too long").optional().nullable(),

  sendEmail: z.boolean().default(false),
  status: z.nativeEnum(LogStatus).default(LogStatus.IN_PROGRESS), // Default to IN_PROGRESS

  // Optional IDs for relations - only one should match entityType
  providerId: z.string().optional().nullable(),
  parkingServiceId: z.string().optional().nullable(),
  bulkServiceId: z.string().optional().nullable(),
  // Add other entity IDs here if you add more types to LogEntityType
});

// Define the input type based on the schema
export type CreateLogEntryInput = z.infer<typeof createLogEntrySchema>;

export async function createLogEntry(
  data: CreateLogEntryInput
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // Authenticate the user
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate input data
    const validatedData = createLogEntrySchema.safeParse(data);

    if (!validatedData.success) {
      console.error("Log entry validation failed:", validatedData.error.errors);
      return { success: false, error: "Invalid input data." };
    }

    const { entityType, entityId, action, subject, description, sendEmail, status, ...entityIds } = validatedData.data;

    // Prepare data for Prisma create, ensuring only the relevant foreign key is set
    const logData: any = {
        entityType,
        entityId, // Store entityId directly for easy access
        action,
        subject,
        description,
        sendEmail,
        status,
        createdById: currentUser.id, // Link to the current user
    };

    // Dynamically set the correct foreign key based on entityType
    switch (entityType) {
        case LogEntityType.PROVIDER:
            // Ensure providerId matches entityId and other entity IDs are null
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
        // Add cases for other entity types
        default:
            return { success: false, error: "Unsupported entity type." };
    }

    // Create the log entry in the database
    const newLogEntry = await db.logEntry.create({
      data: logData,
    });

    // Optional: Implement email sending logic here if sendEmail is true
    // if (sendEmail) {
    //    try {
    //       // Fetch provider/entity details to get email address
    //       let recipientEmail: string | null = null;
    //       if (entityType === LogEntityType.PROVIDER && newLogEntry.providerId) {
    //            const provider = await db.provider.findUnique({ where: { id: newLogEntry.providerId }, select: { email: true } });
    //            recipientEmail = provider?.email || null;
    //       }
    //       // Add cases for other entity types to find email

    //       if (recipientEmail) {
    //           // await sendEmailToProvider(recipientEmail, subject, description || 'No description provided.');
    //           console.log(`Simulating sending email to ${recipientEmail} for log entry ${newLogEntry.id}`);
    //       } else {
    //           console.warn(`Send email requested for log ${newLogEntry.id}, but no recipient email found for entity type ${entityType} with ID ${entityId}.`);
    //       }
    //    } catch (emailError) {
    //        console.error("Failed to send email for log entry:", newLogEntry.id, emailError);
    //        // Decide if you want to return an error here or just log it
    //    }
    // }


    // Return success and the created log entry
    return { success: true, data: newLogEntry };

  } catch (error) {
    console.error("[CREATE_LOG_ENTRY_ERROR]", error);
    // Return a consistent error structure
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create log entry.",
    };
  }
}
