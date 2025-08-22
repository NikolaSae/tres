// actions/complaints/change-status.ts
"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth"; // Proverite putanju za auth
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { ComplaintStatus } from "@prisma/client"; // Uvezeno ComplaintStatus iz Prisma klijenta
import { createNotification } from "@/utils/complaint-notification"; // Proverite putanju za createNotification

// ISPRAVLJENO: Dodat opcionalni assignedAgentId u shemu
const statusChangeSchema = z.object({
  complaintId: z.string().min(1),
  status: z.nativeEnum(ComplaintStatus),
  notes: z.string().optional(),
  assignedAgentId: z.string().optional().nullable(), // Dodato opcionalno/nullable polje za ID agenta
});

export type StatusChangeFormData = z.infer<typeof statusChangeSchema>;

export async function changeComplaintStatus(data: StatusChangeFormData) {
  try {
    const session = await auth();
    if (!session?.user) {
      return {
        error: "Unauthorized. Please sign in to update status.",
      };
    }

    const validatedData = statusChangeSchema.parse(data);

    // Check if complaint exists
    const complaint = await db.complaint.findUnique({
      where: { id: validatedData.complaintId },
      select: { // Dohvatamo i submittedById, assignedAgentId, title za notifikacije
        id: true,
        status: true,
        submittedById: true,
        assignedAgentId: true,
        title: true
      }
    });

    if (!complaint) {
      return {
        error: "Complaint not found",
      };
    }

    // Check permission based on role
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true } // Dohvatamo samo ulogu
    });

    // Proširena provera dozvola: ADMIN/MANAGER mogu sve, AGENT može samo ako je dodeljen ili ako dodeljuje sebi/drugima (za ASSIGNED status)
    const canUpdateStatus =
      user?.role === "ADMIN" ||
      user?.role === "MANAGER" ||
      (user?.role === "AGENT" && (complaint.assignedAgentId === session.user.id || validatedData.status === ComplaintStatus.ASSIGNED)); // AGENT može promeniti status ako je dodeljen ILI ako menja na ASSIGNED (radi dodele)


    if (!canUpdateStatus) {
      return {
        error: "Not authorized to update complaint status",
      };
    }

    const { status, notes, assignedAgentId } = validatedData; // ISPRAVLJENO: Dohvatamo i assignedAgentId
    const previousStatus = complaint.status;

    // Don't update if status hasn't changed AND no new agent is being assigned
    if (status === previousStatus && assignedAgentId === undefined) {
      return {
        info: "Status and assignment unchanged",
      };
    }

    let updateData: any = {};

    // --- Deklaracija promenljive statusChanged ---
    // Ova promenljiva prati da li se status pritužbe zaista menja u ovoj akciji.
    // Koristi se kasnije za kreiranje istorije statusa i slanje notifikacija.
    let statusChanged = false;
    // --- Kraj deklaracije promenljive statusChanged ---


    // Ažuriramo status samo ako je prosleđen i ako se promenio
    if (status !== previousStatus) {
      updateData.status = status;
      statusChanged = true; // Postavljamo na true jer se status promenio
      // Ažuriramo datume samo ako se status menja na odgovarajući
      if (status === ComplaintStatus.ASSIGNED && !complaint.assignedAgentId) {
        // Ako se status menja na ASSIGNED i pritužba nije bila dodeljena,
        // postavi datum dodele. Agent ID će biti postavljen ispod.
        updateData.assignedAt = new Date();
      } else if (status === ComplaintStatus.RESOLVED && !complaint.resolvedAt) {
        updateData.resolvedAt = new Date();
      } else if (status === ComplaintStatus.CLOSED && !complaint.closedAt) {
        updateData.closedAt = new Date();
      }
    }

    // Logika za dodelu agenta:
    // Ako je prosleđen assignedAgentId (sa frontenda)
    if (assignedAgentId !== undefined) { // Proveravamo da li je eksplicitno prosleđen (može biti null za poništavanje dodele)
      updateData.assignedAgentId = assignedAgentId;
      // Ako se agent dodeljuje (nije null) i pritužba nije imala agenta, postavi assignedAt
      if (assignedAgentId !== null && !complaint.assignedAgentId) {
        updateData.assignedAt = new Date();
      } else if (assignedAgentId === null && complaint.assignedAgentId) {
        // Ako se agent poništava (postavlja na null) i pritužba je imala agenta, poništi assignedAt
        updateData.assignedAt = null;
      }
    } else if (status === ComplaintStatus.ASSIGNED && !complaint.assignedAgentId) {
      // Ako status postaje ASSIGNED i NIJE prosleđen assignedAgentId, dodeli trenutnom korisniku (ponašanje "Take Ownership")
      updateData.assignedAgentId = session.user.id;
      updateData.assignedAt = new Date();
    }


    // Ako nema podataka za ažuriranje, izlazimo
    if (Object.keys(updateData).length === 0) {
      return { info: "No changes to apply." };
    }

    // Update the complaint
    const updatedComplaint = await db.complaint.update({
      where: { id: complaint.id }, // Koristimo complaint.id iz dohvaćenog objekta
      data: updateData,
      include: { // Uključujemo relacije potrebne za notifikacije/povratnu vrednost
        submittedBy: { select: { id: true, name: true, email: true } },
        assignedAgent: { select: { id: true, name: true, email: true } },
      }
    });

    // Create status history entry if status changed
    if (statusChanged && status) { // <-- Korišćenje promenljive statusChanged
      await db.complaintStatusHistory.create({
        data: {
          complaintId: complaint.id, // Koristimo complaint.id
          previousStatus,
          newStatus: status,
          changedById: session.user.id,
          notes: notes || null,
        },
      });
    }

    // Record the activity (možda dodati detalje o dodeli agenta ako se promenio)
    await db.activityLog.create({
      data: {
        action: statusChanged ? "COMPLAINT_STATUS_CHANGED" : "COMPLAINT_ASSIGNED", // Prilagoditi akciju loga
        entityType: "complaint",
        entityId: complaint.id, // Koristimo complaint.id
        details: statusChanged ?
          `Complaint status changed from ${previousStatus} to ${status}` :
          `Complaint assigned to ${updatedComplaint.assignedAgent?.name || updatedComplaint.assignedAgent?.email || 'N/A'}`,
        userId: session.user.id,
        severity: status === ComplaintStatus.REJECTED ? "WARNING" : "INFO", // Prilagoditi nivo ozbiljnosti
      },
    });

    // Create notification for the submitter (ako status nije ASSIGNED)
    if (statusChanged && status !== ComplaintStatus.ASSIGNED && complaint.submittedById !== session.user.id) { // Dodata provera statusChanged
      await createNotification({
        type: "COMPLAINT_UPDATED", // Proverite tip notifikacije
        title: "Complaint Status Update",
        message: `The status of your complaint "${complaint.title}" has been updated to ${status}.`,
        entityType: "complaint",
        entityId: complaint.id, // Koristimo complaint.id
        userId: complaint.submittedById,
      });
    }

    // Create notification for the assigned agent if different AND assignment changed
    // Proveravamo da li se assignedAgentId promenio i da li nije null, i da nije trenutni korisnik
    if (updateData.assignedAgentId !== undefined && updateData.assignedAgentId !== null && updateData.assignedAgentId !== complaint.assignedAgentId && updateData.assignedAgentId !== session.user.id) {
      await createNotification({
        type: "COMPLAINT_ASSIGNED", // Proverite tip notifikacije
        title: "Complaint Assigned to You",
        message: `You have been assigned to handle complaint: "${updatedComplaint.title}"`,
        entityType: "complaint",
        entityId: complaint.id, // Koristimo complaint.id
        userId: updateData.assignedAgentId, // Šaljemo notifikaciju novom dodeljenom agentu
      });
    } else if (updateData.assignedAgentId === null && complaint.assignedAgentId) {
        // Notifikacija ako je dodela poništena
         await createNotification({
          type: "COMPLAINT_UPDATED", // Možda bolji tip notifikacije?
          title: "Complaint Assignment Removed",
          message: `Assignment for complaint "${complaint.title}" has been removed.`,
          entityType: "complaint",
          entityId: complaint.id,
          roles: ["ADMIN", "MANAGER"], // Notifikujemo admine/menadžere
        });
    }


    revalidatePath(`/complaints/${updatedComplaint.id}`);

    return { success: true, updatedComplaint };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.format();

      return {
        error: "Validation failed",
        formErrors: formattedErrors,
      };
    }

    console.error("[STATUS_CHANGE_ERROR]", error);

    return {
      error: "Failed to update status. Please try again.",
    };
  }
}
