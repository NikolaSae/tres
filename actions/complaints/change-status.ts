// actions/complaints/change-status.ts
"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { ComplaintStatus } from "@prisma/client";
import { createNotification } from "@/utils/complaint-notification";

// Schema za promenu statusa (već dobro)
const statusChangeSchema = z.object({
  complaintId: z.string().min(1),
  status: z.nativeEnum(ComplaintStatus),
  notes: z.string().optional(),
  assignedAgentId: z.string().optional().nullable(),
});

export type StatusChangeFormData = z.infer<typeof statusChangeSchema>;

export async function changeComplaintStatus(data: StatusChangeFormData) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: "Unauthorized. Please sign in to update status." };
    }

    const validatedData = statusChangeSchema.parse(data);

    // Dohvatanje pritužbe sa SVIM potrebnim datum poljima
    const complaint = await db.complaint.findUnique({
      where: { id: validatedData.complaintId },
      select: {
        id: true,
        status: true,
        submittedById: true,
        assignedAgentId: true,
        title: true,
        assignedAt: true,      // ← DODATO
        resolvedAt: true,      // ← DODATO
        closedAt: true,        // ← DODATO
      },
    });

    if (!complaint) {
      return { error: "Complaint not found" };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    const canUpdateStatus =
      user?.role === "ADMIN" ||
      user?.role === "MANAGER" ||
      (user?.role === "AGENT" &&
        (complaint.assignedAgentId === session.user.id ||
          validatedData.status === ComplaintStatus.ASSIGNED));

    if (!canUpdateStatus) {
      return { error: "Not authorized to update complaint status" };
    }

    const { status, notes, assignedAgentId } = validatedData;
    const previousStatus = complaint.status;

    if (status === previousStatus && assignedAgentId === undefined) {
      return { info: "Status and assignment unchanged" };
    }

    let updateData: any = {};
    let statusChanged = false;

    if (status !== previousStatus) {
      updateData.status = status;
      statusChanged = true;

      if (status === ComplaintStatus.ASSIGNED && !complaint.assignedAt) {
        updateData.assignedAt = new Date();
      } else if (status === ComplaintStatus.RESOLVED && !complaint.resolvedAt) {
        updateData.resolvedAt = new Date();
      } else if (status === ComplaintStatus.CLOSED && !complaint.closedAt) {
        updateData.closedAt = new Date();
      }
    }

    // Logika za dodelu agenta
    if (assignedAgentId !== undefined) {
      updateData.assignedAgentId = assignedAgentId;

      if (assignedAgentId !== null && !complaint.assignedAgentId) {
        updateData.assignedAt = new Date();
      } else if (assignedAgentId === null && complaint.assignedAgentId) {
        updateData.assignedAt = null;
      }
    } else if (status === ComplaintStatus.ASSIGNED && !complaint.assignedAgentId) {
      updateData.assignedAgentId = session.user.id;
      updateData.assignedAt = new Date();
    }

    if (Object.keys(updateData).length === 0) {
      return { info: "No changes to apply." };
    }

    // Ažuriranje pritužbe
    const updatedComplaint = await db.complaint.update({
      where: { id: complaint.id },
      data: updateData,
      include: {
        submittedBy: { select: { id: true, name: true, email: true } },
        assignedAgent: { select: { id: true, name: true, email: true } },
      },
    });

    // Kreiranje istorije statusa (samo ako se status promenio)
    if (statusChanged) {
      await db.complaintStatusHistory.create({
        data: {
          complaintId: complaint.id,
          previousStatus,
          newStatus: status,
          changedById: session.user.id,
          notes: notes || null,
        },
      });
    }

    // Activity log
    await db.activityLog.create({
      data: {
        action: statusChanged ? "COMPLAINT_STATUS_CHANGED" : "COMPLAINT_ASSIGNED",
        entityType: "complaint",
        entityId: complaint.id,
        details: statusChanged
          ? `Status promenjen sa ${previousStatus} na ${status}`
          : `Pritužba dodeljena agentu ${updatedComplaint.assignedAgent?.name || "N/A"}`,
        userId: session.user.id,
        severity: status === ComplaintStatus.REJECTED ? "WARNING" : "INFO",
      },
    });

    // Notifikacije
    if (statusChanged && status !== ComplaintStatus.ASSIGNED && complaint.submittedById !== session.user.id) {
      await createNotification({
        type: "COMPLAINT_UPDATED",
        title: "Ažuriran status pritužbe",
        message: `Status vaše pritužbe "${complaint.title}" promenjen u ${status}.`,
        entityType: "complaint",
        entityId: complaint.id,
        userId: complaint.submittedById,
      });
    }

    if (
      updateData.assignedAgentId !== undefined &&
      updateData.assignedAgentId !== null &&
      updateData.assignedAgentId !== complaint.assignedAgentId &&
      updateData.assignedAgentId !== session.user.id
    ) {
      await createNotification({
        type: "COMPLAINT_ASSIGNED",
        title: "Pritužba vam je dodeljena",
        message: `Dodeljena vam je pritužba: "${updatedComplaint.title}"`,
        entityType: "complaint",
        entityId: complaint.id,
        userId: updateData.assignedAgentId,
      });
    } else if (updateData.assignedAgentId === null && complaint.assignedAgentId) {
      await createNotification({
        type: "COMPLAINT_UPDATED",
        title: "Uklonjena dodela pritužbe",
        message: `Dodela za pritužbu "${complaint.title}" je uklonjena.`,
        entityType: "complaint",
        entityId: complaint.id,
        roles: ["ADMIN", "MANAGER"],
      });
    }

    revalidatePath(`/complaints/${updatedComplaint.id}`);

    return { success: true, updatedComplaint };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: "Validacija neuspešna",
        formErrors: error.format(),
      };
    }

    console.error("[STATUS_CHANGE_ERROR]", error);

    return {
      error: "Neuspešno ažuriranje statusa. Pokušajte ponovo.",
    };
  }
}