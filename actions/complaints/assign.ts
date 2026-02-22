// Path: actions/complaints/assign.ts
"use server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { UserRole, ComplaintStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

interface AssignComplaintParams {
  complaintId: string;
  userId: string | null;
}

export async function assignComplaint({ complaintId, userId }: AssignComplaintParams) {
  try {
    const session = await auth();
    if (
      !session?.user?.id ||
      (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.MANAGER)
    ) {
      return { error: "Unauthorized" };
    }

    const existingComplaint = await db.complaint.findUnique({
      where: { id: complaintId },
      select: { id: true, status: true, assignedAgentId: true },
    });

    if (!existingComplaint) return { error: "Complaint not found." };

    const updateData: { assignedAgentId: string | null; status?: ComplaintStatus } = {
      assignedAgentId: userId,
    };

    if (userId !== null && existingComplaint.status === ComplaintStatus.NEW) {
      updateData.status = ComplaintStatus.ASSIGNED;
      await db.complaintStatusHistory.create({
        data: {
          complaintId,
          previousStatus: existingComplaint.status,
          newStatus: ComplaintStatus.ASSIGNED,
          changedById: session.user.id,
          notes: `Complaint assigned to user ID ${userId}`,
        },
      });
    } else if (userId === null && existingComplaint.assignedAgentId !== null) {
      await db.complaintStatusHistory.create({
        data: {
          complaintId,
          previousStatus: existingComplaint.status,
          newStatus: existingComplaint.status,
          changedById: session.user.id,
          notes: `Complaint unassigned`,
        },
      });
    }

    const updatedComplaint = await db.complaint.update({
      where: { id: complaintId },
      data: updateData,
    });

    revalidatePath(`/complaints/${complaintId}`);
    revalidatePath("/complaints");

    return { success: true, complaint: updatedComplaint };
  } catch (error) {
    console.error("Error assigning complaint:", error);
    return { error: "Failed to assign complaint." };
  }
}