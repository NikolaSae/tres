// /app/api/complaints/[id]/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { z } from "zod";
import { ComplaintStatus } from "@prisma/client";

const statusUpdateSchema = z.object({
  status: z.nativeEnum(ComplaintStatus),
  notes: z.string().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const complaintId = params.id;
    const body = await req.json();
    
    const validatedData = statusUpdateSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(validatedData.error.format(), { status: 400 });
    }

    // Check if complaint exists
    const complaint = await db.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      return new NextResponse("Complaint not found", { status: 404 });
    }

    // Check permission based on role
    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    const canUpdateStatus = 
      user?.role === "ADMIN" || 
      user?.role === "MANAGER" || 
      (user?.role === "AGENT" && complaint.assignedAgentId === session.user.id);

    if (!canUpdateStatus) {
      return new NextResponse("Not authorized to update complaint status", { status: 403 });
    }

    const { status, notes } = validatedData.data;
    const previousStatus = complaint.status;

    // Special handling for certain status transitions
    let updateData: any = { status };

    if (status === "ASSIGNED" && !complaint.assignedAgentId) {
      updateData.assignedAgentId = session.user.id;
      updateData.assignedAt = new Date();
    }

    if (status === "RESOLVED" && !complaint.resolvedAt) {
      updateData.resolvedAt = new Date();
    }

    if (status === "CLOSED" && !complaint.closedAt) {
      updateData.closedAt = new Date();
    }

    // Update the complaint status
    const updatedComplaint = await db.complaint.update({
      where: { id: complaintId },
      data: updateData,
      include: {
        service: true,
        product: true,
        provider: true,
        assignedAgent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        submittedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Record the status change in history
    await db.complaintStatusHistory.create({
      data: {
        complaintId,
        previousStatus,
        newStatus: status,
        changedById: session.user.id,
        notes: notes || null,
      },
    });

    // Log the activity
    await db.activityLog.create({
      data: {
        action: "COMPLAINT_STATUS_CHANGED",
        entityType: "complaint",
        entityId: complaintId,
        details: `Complaint status changed from ${previousStatus} to ${status}`,
        userId: session.user.id,
      },
    });

    // Create notification for the submitter
    if (complaint.submittedById !== session.user.id) {
      await db.notification.create({
        data: {
          title: "Complaint Status Update",
          message: `The status of your complaint "${complaint.title}" has been updated to ${status}.`,
          type: "COMPLAINT_UPDATED",
          userId: complaint.submittedById,
          entityType: "complaint",
          entityId: complaintId,
        },
      });
    }

    // Create notification for the assigned agent if different
    if (
      complaint.assignedAgentId && 
      complaint.assignedAgentId !== session.user.id &&
      status !== previousStatus
    ) {
      await db.notification.create({
        data: {
          title: "Complaint Status Update",
          message: `The status of complaint "${complaint.title}" that you're assigned to has been updated to ${status}.`,
          type: "COMPLAINT_UPDATED",
          userId: complaint.assignedAgentId,
          entityType: "complaint",
          entityId: complaintId,
        },
      });
    }

    return NextResponse.json(updatedComplaint);
  } catch (error) {
    console.error("[STATUS_UPDATE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const complaintId = params.id;

    // Check if complaint exists
    const complaint = await db.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      return new NextResponse("Complaint not found", { status: 404 });
    }

    // Get status history for the complaint
    const statusHistory = await db.complaintStatusHistory.findMany({
      where: { complaintId },
      orderBy: { changedAt: "desc" },
      include: {
        complaint: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json(statusHistory);
  } catch (error) {
    console.error("[STATUS_HISTORY_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}