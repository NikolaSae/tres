// actions/complaints/update.ts
"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ComplaintStatus, UserRole } from "@prisma/client"; // ← uklonjen ComplaintEntityType (ne postoji)
import { ComplaintImportData } from "@/lib/types/complaint-types"; // ← promenjeno

const updateComplaintSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title cannot exceed 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  
  entityType: z.string().optional(), // ← promenjeno u string jer enum ne postoji
  serviceId: z.string().optional().nullable(),
  productId: z.string().optional().nullable(),
  providerId: z.string().optional().nullable(),
  humanitarianOrgId: z.string().optional().nullable(),
  parkingServiceId: z.string().optional().nullable(),
  bulkServiceId: z.string().optional().nullable(),

  priority: z.number().min(1).max(5),
  financialImpact: z.number().optional().nullable(),
  status: z.nativeEnum(ComplaintStatus).optional(),
  assignedAgentId: z.string().optional().nullable(),
});

export type UpdateComplaintFormData = z.infer<typeof updateComplaintSchema>;

export async function updateComplaint(data: UpdateComplaintFormData) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: "Unauthorized. Please sign in to update a complaint." };
    }

    const validatedData = updateComplaintSchema.parse(data);

    const existingComplaint = await db.complaint.findUnique({
      where: { id: validatedData.id },
    });

    if (!existingComplaint) {
      return { error: "Complaint not found" };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    const isSubmitter = existingComplaint.submittedById === session.user.id;
    const isAssigned = existingComplaint.assignedAgentId === session.user.id;
    const canUpdate = [UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT].includes(user?.role as UserRole) || isSubmitter || isAssigned;

    if (!canUpdate) {
      return { error: "You don't have permission to update this complaint" };
    }

    let updateData: any = {};
    
    // Always allow these fields
    updateData.title = validatedData.title;
    updateData.description = validatedData.description;
    updateData.priority = validatedData.priority;
    updateData.financialImpact = validatedData.financialImpact;

    // Staff-only fields
    if ([UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT].includes(user?.role as UserRole)) {
      updateData.entityType = validatedData.entityType;
      
      // Reset related IDs
      updateData.serviceId = null;
      updateData.productId = null;
      updateData.providerId = null;
      updateData.humanitarianOrgId = null;
      updateData.parkingServiceId = null;
      updateData.bulkServiceId = null;

      // Set correct ID based on entityType (string-based)
      switch (validatedData.entityType) {
        case "PROVIDER":
          updateData.providerId = validatedData.providerId;
          break;
        case "HUMANITARIAN_ORG":
          updateData.humanitarianOrgId = validatedData.humanitarianOrgId;
          break;
        case "PARKING_SERVICE":
          updateData.parkingServiceId = validatedData.parkingServiceId;
          break;
        case "BULK_SERVICE":
          updateData.bulkServiceId = validatedData.bulkServiceId;
          break;
        case "SERVICE":
          updateData.serviceId = validatedData.serviceId;
          break;
        case "PRODUCT":
          updateData.productId = validatedData.productId;
          break;
      }
      
      // Status handling (same as before)
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
      
      // Assignment handling (same as before)
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

    // ... ostatak koda (activity log, notifications, revalidate, redirect) ostaje isti

    revalidatePath(`/complaints/${updatedComplaint.id}`);
    redirect(`/complaints/${updatedComplaint.id}`);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: "Validation failed",
        formErrors: error.format(),
      };
    }
    
    console.error("[COMPLAINT_UPDATE_ERROR]", error);
    
    return {
      error: "Failed to update complaint. Please try again.",
    };
  }
}