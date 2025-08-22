// /actions/complaints/update.ts
"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ComplaintStatus, ComplaintEntityType, UserRole } from "@prisma/client"; // Import UserRole
import { ComplaintFormData } from "@/lib/types/complaint-types";

const updateComplaintSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title cannot exceed 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  
  entityType: z.nativeEnum(ComplaintEntityType).optional(), // Optional for update, as it might not be changed by restricted users
  serviceId: z.string().optional().nullable(),
  productId: z.string().optional().nullable(),
  providerId: z.string().optional().nullable(),
  humanitarianOrgId: z.string().optional().nullable(),
  parkingServiceId: z.string().optional().nullable(),
  bulkServiceId: z.string().optional().nullable(),

  priority: z.number().min(1).max(5), // Always allow priority to be updated
  financialImpact: z.number().optional().nullable(), // Always allow financialImpact to be updated
  status: z.nativeEnum(ComplaintStatus).optional(),
  assignedAgentId: z.string().optional().nullable(),
});

export type UpdateComplaintFormData = z.infer<typeof updateComplaintSchema>;

export async function updateComplaint(data: UpdateComplaintFormData) {
  try {
    const session = await auth();
    if (!session?.user) {
      return {
        error: "Unauthorized. Please sign in to update a complaint.",
      };
    }

    const validatedData = updateComplaintSchema.parse(data);

    const existingComplaint = await db.complaint.findUnique({
      where: { id: validatedData.id },
    });

    if (!existingComplaint) {
      return {
        error: "Complaint not found",
      };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    const isSubmitter = existingComplaint.submittedById === session.user.id;
    const isAssigned = existingComplaint.assignedAgentId === session.user.id;
    const canUpdate = [UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT].includes(user?.role as UserRole) || isSubmitter || isAssigned;

    if (!canUpdate) {
      return {
        error: "You don't have permission to update this complaint",
      };
    }

    let updateData: any = {};
    
    // Always allow these fields to be updated by any permitted user
    updateData.title = validatedData.title;
    updateData.description = validatedData.description;
    updateData.priority = validatedData.priority;
    updateData.financialImpact = validatedData.financialImpact;

    // Only staff roles (ADMIN, MANAGER, AGENT) can update entityType and associated IDs, status, and assignment
    if ([UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT].includes(user?.role as UserRole)) {
      // Update entityType and associated IDs
      updateData.entityType = validatedData.entityType;
      
      // Reset all related IDs to null before setting the correct one
      updateData.serviceId = null;
      updateData.productId = null;
      updateData.providerId = null;
      updateData.humanitarianOrgId = null;
      updateData.parkingServiceId = null;
      updateData.bulkServiceId = null;

      // Set the correct ID based on entityType
      switch (validatedData.entityType) {
        case ComplaintEntityType.PROVIDER:
          updateData.providerId = validatedData.providerId;
          break;
        case ComplaintEntityType.HUMANITARIAN_ORG:
          updateData.humanitarianOrgId = validatedData.humanitarianOrgId;
          break;
        case ComplaintEntityType.PARKING_SERVICE:
          updateData.parkingServiceId = validatedData.parkingServiceId;
          break;
        case ComplaintEntityType.BULK_SERVICE:
          updateData.bulkServiceId = validatedData.bulkServiceId;
          break;
        case ComplaintEntityType.SERVICE:
          updateData.serviceId = validatedData.serviceId;
          break;
        case ComplaintEntityType.PRODUCT:
          updateData.productId = validatedData.productId;
          break;
        default:
          break;
      }
      
      // Handle status changes
      if (validatedData.status && validatedData.status !== existingComplaint.status) {
        updateData.status = validatedData.status;
        
        if (validatedData.status === "RESOLVED" && !existingComplaint.resolvedAt) {
          updateData.resolvedAt = new Date();
        }
        
        if (validatedData.status === "CLOSED" && !existingComplaint.closedAt) {
          updateData.closedAt = new Date();
        }
        
        await db.complaintStatusHistory.create({
          data: {
            complaintId: existingComplaint.id,
            previousStatus: existingComplaint.status,
            newStatus: validatedData.status,
            changedById: session.user.id,
          },
        });
      }
      
      // Handle agent assignment changes
      if (validatedData.assignedAgentId !== existingComplaint.assignedAgentId) {
        updateData.assignedAgentId = validatedData.assignedAgentId;
        
        if (validatedData.assignedAgentId && !existingComplaint.assignedAgentId) {
          updateData.assignedAt = new Date();
          updateData.status = "ASSIGNED";
          
          if (existingComplaint.status !== "ASSIGNED") {
            await db.complaintStatusHistory.create({
              data: {
                complaintId: existingComplaint.id,
                previousStatus: existingComplaint.status,
                newStatus: "ASSIGNED",
                changedById: session.user.id,
              },
            });
          }
          
          await db.notification.create({
            data: {
              title: "Complaint Assigned",
              message: `You have been assigned to handle complaint: "${existingComplaint.title}"`,
              type: "COMPLAINT_ASSIGNED",
              userId: validatedData.assignedAgentId,
              entityType: "complaint",
              entityId: existingComplaint.id,
            },
          });
        }
      }
    }

    const updatedComplaint = await db.complaint.update({
      where: { id: validatedData.id },
      data: updateData,
    });

    await db.activityLog.create({
      data: {
        action: "COMPLAINT_UPDATED",
        entityType: "complaint",
        entityId: existingComplaint.id,
        details: `Complaint updated: ${existingComplaint.title}`,
        userId: session.user.id,
      },
    });

    if (existingComplaint.submittedById !== session.user.id) {
      await db.notification.create({
        data: {
          title: "Complaint Updated",
          message: `Your complaint "${existingComplaint.title}" has been updated.`,
          type: "COMPLAINT_UPDATED",
          userId: existingComplaint.submittedById,
          entityType: "complaint",
          entityId: existingComplaint.id,
        },
      });
    }

    if (
      existingComplaint.assignedAgentId &&
      existingComplaint.assignedAgentId !== session.user.id &&
      existingComplaint.assignedAgentId === updateData.assignedAgentId
    ) {
      await db.notification.create({
        data: {
          title: "Assigned Complaint Updated",
          message: `Complaint "${existingComplaint.title}" that you're assigned to has been updated.`,
          type: "COMPLAINT_UPDATED",
          userId: existingComplaint.assignedAgentId,
          entityType: "complaint",
          entityId: existingComplaint.id,
        },
      });
    }

    revalidatePath(`/complaints/${updatedComplaint.id}`);
    redirect(`/complaints/${updatedComplaint.id}`);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.format();
      
      return {
        error: "Validation failed",
        formErrors: formattedErrors,
      };
    }
    
    console.error("[COMPLAINT_UPDATE_ERROR]", error);
    
    return {
      error: "Failed to update complaint. Please try again.",
    };
  }
}
