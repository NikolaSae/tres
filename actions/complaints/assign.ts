// Path: actions/complaints/assign.ts
"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { UserRole, ComplaintStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

interface AssignComplaintParams {
    complaintId: string;
    userId: string | null; // null to unassign
}

/**
 * Assigns a complaint to a specific user (Agent or Admin).
 * Only accessible by Admin and Manager roles.
 * Updates complaint status to ASSIGNED if a user is assigned and status is NEW.
 * @param params - Object containing complaintId and userId (or null to unassign).
 * @returns A promise resolving to a success object or an error object.
 */
export async function assignComplaint({ complaintId, userId }: AssignComplaintParams) {
  try {
    const session = await auth();

    // Check if the user is authenticated and has the necessary role (Admin or Manager)
    if (!session || !session.user || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.MANAGER)) {
      return { error: "Unauthorized" };
    }

    // Fetch the current complaint to check its status
    const existingComplaint = await db.complaint.findUnique({
        where: { id: complaintId },
        select: { id: true, status: true, assignedAgentId: true }
    });

    if (!existingComplaint) {
        return { error: "Complaint not found." };
    }

    // Prepare update data
    const updateData: any = {
        assignedAgentId: userId,
    };

    // If assigning a user and the current status is NEW, change status to ASSIGNED
    if (userId !== null && existingComplaint.status === ComplaintStatus.NEW) {
        updateData.status = ComplaintStatus.ASSIGNED;
        // Optionally add a status history entry here
        await db.complaintStatusHistory.create({
            data: {
                complaintId: complaintId,
                previousStatus: existingComplaint.status,
                newStatus: ComplaintStatus.ASSIGNED,
                changedById: session.user.id,
                notes: `Complaint assigned to user ID ${userId}`
            }
        });
    } else if (userId === null && existingComplaint.assignedAgentId !== null) {
         // If unassigning and it was previously assigned, maybe change status back? (Optional logic)
         // For now, we'll just update the assignedAgentId
         // Optionally add a status history entry for unassignment
         await db.complaintStatusHistory.create({
            data: {
                complaintId: complaintId,
                previousStatus: existingComplaint.status, // Keep current status
                newStatus: existingComplaint.status,
                changedById: session.user.id,
                notes: `Complaint unassigned`
            }
        });
    }


    // Update the complaint in the database
    const updatedComplaint = await db.complaint.update({
      where: { id: complaintId },
      data: updateData,
    });

    // Revalidate the complaint detail page to show the updated data
    revalidatePath(`/complaints/${complaintId}`);
    // Consider revalidating the complaints list page as well if assignment affects the list view
    revalidatePath('/complaints');


    return { success: true, complaint: updatedComplaint }; // Return success and the updated complaint

  } catch (error) {
    console.error("Error assigning complaint:", error);
    return { error: "Failed to assign complaint." };
  }
}
