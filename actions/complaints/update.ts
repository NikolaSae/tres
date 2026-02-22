// actions/complaints/update.ts
"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ComplaintStatus, UserRole, LogSeverity } from "@prisma/client";

const updateComplaintSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(5).max(100),
  description: z.string().min(10),
  entityType: z.string().optional(),
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

// ✅ Typed umesto any
interface ComplaintUpdateData {
  title: string;
  description: string;
  priority: number;
  financialImpact?: number | null;
  entityType?: string;
  serviceId?: string | null;
  productId?: string | null;
  providerId?: string | null;
  humanitarianOrgId?: string | null;
  parkingServiceId?: string | null;
  bulkServiceId?: string | null;
  status?: ComplaintStatus;
  assignedAgentId?: string | null;
  assignedAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
}

export async function updateComplaint(data: UpdateComplaintFormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized. Please sign in to update a complaint." };
    }

    const validatedData = updateComplaintSchema.parse(data);

    const existingComplaint = await db.complaint.findUnique({
      where: { id: validatedData.id },
    });

    if (!existingComplaint) return { error: "Pritužba nije pronađena" };

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    const isSubmitter = existingComplaint.submittedById === session.user.id;
    const isAssigned = existingComplaint.assignedAgentId === session.user.id;
    const isStaff =
      user?.role === UserRole.ADMIN ||
      user?.role === UserRole.MANAGER ||
      user?.role === UserRole.AGENT;

    if (!isStaff && !isSubmitter && !isAssigned) {
      return { error: "Nemate dozvolu da ažurirate ovu pritužbu" };
    }

    const updateData: ComplaintUpdateData = {
      title: validatedData.title,
      description: validatedData.description,
      priority: validatedData.priority,
      financialImpact: validatedData.financialImpact,
    };

    if (isStaff) {
      updateData.entityType = validatedData.entityType;
      updateData.serviceId = null;
      updateData.productId = null;
      updateData.providerId = null;
      updateData.humanitarianOrgId = null;
      updateData.parkingServiceId = null;
      updateData.bulkServiceId = null;

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

      if (validatedData.status && validatedData.status !== existingComplaint.status) {
        updateData.status = validatedData.status;

        if (validatedData.status === ComplaintStatus.RESOLVED && !existingComplaint.resolvedAt) {
          updateData.resolvedAt = new Date();
        }
        if (validatedData.status === ComplaintStatus.CLOSED && !existingComplaint.closedAt) {
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

      if (validatedData.assignedAgentId !== existingComplaint.assignedAgentId) {
        updateData.assignedAgentId = validatedData.assignedAgentId;

        if (validatedData.assignedAgentId && !existingComplaint.assignedAgentId) {
          updateData.assignedAt = new Date();
          updateData.status = ComplaintStatus.ASSIGNED;

          if (existingComplaint.status !== ComplaintStatus.ASSIGNED) {
            await db.complaintStatusHistory.create({
              data: {
                complaintId: existingComplaint.id,
                previousStatus: existingComplaint.status,
                newStatus: ComplaintStatus.ASSIGNED,
                changedById: session.user.id,
              },
            });
          }

          await db.notification.create({
            data: {
              title: "Pritužba vam je dodeljena",
              message: `Dodeljena vam je pritužba: "${existingComplaint.title}"`,
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
        details: `Pritužba ažurirana: ${existingComplaint.title}`,
        userId: session.user.id,
        severity: LogSeverity.INFO,
      },
    });

    if (existingComplaint.submittedById !== session.user.id) {
      await db.notification.create({
        data: {
          title: "Pritužba ažurirana",
          message: `Vaša pritužba "${existingComplaint.title}" je ažurirana.`,
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
          title: "Dodeljena pritužba ažurirana",
          message: `Pritužba "${existingComplaint.title}" koju vodite je ažurirana.`,
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
      return { error: "Validacija neuspešna", formErrors: error.format() };
    }
    console.error("[COMPLAINT_UPDATE_ERROR]", error);
    return { error: "Neuspešno ažuriranje pritužbe. Pokušajte ponovo." };
  }
}