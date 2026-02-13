// lib/actions/complaints.ts
"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ComplaintStatus } from "@prisma/client";

import { Complaint, ComplaintFilters, CreateComplaintData, UpdateComplaintData } from "@/lib/types/interfaces";

import { createNotification } from "@/utils/complaint-notification";
import { calculateStatistics, detectAnomalies } from "@/utils/complaint-statistics";


/**
 * Get all complaints with optional filtering
 */
export async function getComplaints(filters?: ComplaintFilters): Promise<Complaint[]> {
  const {
    status,
    priority,
    serviceId,
    productId,
    providerId,
    submittedById,
    assignedAgentId,
    startDate,
    endDate,
    search,
    limit,
    offset,
    sortBy = "createdAt",
    sortOrder = "desc"
  } = filters || {};

  const where: any = {};

  // Apply filters if provided
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (serviceId) where.serviceId = serviceId;
  if (productId) where.productId = productId;
  if (providerId) where.providerId = providerId;
  if (submittedById) where.submittedById = submittedById;
  if (assignedAgentId) where.assignedAgentId = assignedAgentId;

  // Date range filtering
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate && !isNaN(new Date(startDate).getTime())) where.createdAt.gte = startDate;
    if (endDate && !isNaN(new Date(endDate).getTime())) where.createdAt.lte = endDate;
    if (Object.keys(where.createdAt).length === 0) delete where.createdAt;
  }

  // Search functionality (searching in title and description)
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  const complaints = await db.complaint.findMany({
    where,
    include: {
      service: true,
      product: true,
      provider: true,
      submittedBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      assignedAgent: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
    },
    orderBy: {
      [sortBy]: sortOrder as any
    },
    take: limit,
    skip: offset
  });

  return complaints as any;
}

/**
 * Get a complaint by its ID
 */
export async function getComplaintById(id: string): Promise<Complaint | null> {
  const complaint = await db.complaint.findUnique({
    where: { id },
    include: {
      service: true,
      product: true,
      provider: true,
      submittedBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      assignedAgent: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      comments: {
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      },
      attachments: true,
      statusHistory: {
        orderBy: {
          changedAt: 'desc'
        }
      }
    }
  });

  return complaint as any;
}

/**
 * Create a new complaint
 */
export async function createComplaint(data: CreateComplaintData, userId: string): Promise<Complaint> {
  const { title, description, serviceId, productId, providerId, priority, financialImpact } = data;

  const complaint = await db.complaint.create({
    data: {
      title,
      description,
      priority: priority || 3,
      financialImpact,
      service: serviceId ? { connect: { id: serviceId } } : undefined,
      product: productId ? { connect: { id: productId } } : undefined,
      provider: providerId ? { connect: { id: providerId } } : undefined,
      submittedBy: { connect: { id: userId } },
      statusHistory: {
        create: {
          newStatus: ComplaintStatus.NEW,
          changedById: userId
        }
      }
    },
    include: {
      service: true,
      product: true,
      provider: true,
      submittedBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  // Create notification for admins/managers about new complaint
  await createNotification({
    type: "COMPLAINT_UPDATED",
    title: "New Complaint Submitted",
    message: `A new complaint "${complaint.title}" has been submitted and needs assignment.`,
    entityType: "complaint",
    entityId: complaint.id,
    roles: ["ADMIN", "MANAGER"]
  });

  // Check for anomalies
  const anomalies = detectAnomalies([complaint]);
  if (anomalies.length > 0) {
    await createNotification({
      type: "SYSTEM",
      title: "Potential Anomaly Detected",
      message: `Complaint "${complaint.title}" may require special attention: ${anomalies.map(a => a.description).join(", ")}`,
      entityType: "complaint",
      entityId: complaint.id,
      roles: ["ADMIN", "MANAGER"]
    });
  }

  return complaint as any;
}

/**
 * Update an existing complaint
 */
export async function updateComplaint(id: string, data: UpdateComplaintData, userId: string): Promise<Complaint> {
  const { title, description, status, priority, financialImpact, serviceId, productId, providerId, assignedAgentId } = data;

  // Get the current status to track changes
  const currentComplaint = await db.complaint.findUnique({
    where: { id },
    select: { status: true, submittedById: true, assignedAgentId: true, title: true }
  });

  if (!currentComplaint) {
    throw new Error("Complaint not found");
  }

  let statusChanged = false;
  let oldStatus: ComplaintStatus | null = null;

  if (status && currentComplaint.status !== status) {
    statusChanged = true;
    oldStatus = currentComplaint.status;
  }

  // Update the complaint
  const updatedComplaint = await db.complaint.update({
    where: { id },
    data: {
      title,
      description,
      status,
      priority,
      financialImpact,
      assignedAt: status === ComplaintStatus.ASSIGNED ? new Date() : undefined,
      resolvedAt: status === ComplaintStatus.RESOLVED ? new Date() : undefined,
      closedAt: status === ComplaintStatus.CLOSED ? new Date() : undefined,
      service: serviceId ? { connect: { id: serviceId } } : undefined,
      product: productId ? { connect: { id: productId } } : undefined,
      provider: providerId ? { connect: { id: providerId } } : undefined,
      assignedAgent: assignedAgentId ? { connect: { id: assignedAgentId } } : undefined,
    },
    include: {
      service: true,
      product: true,
      provider: true,
      submittedBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      assignedAgent: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  // Create status history entry if status changed
  if (statusChanged && status) {
    await db.complaintStatusHistory.create({
      data: {
        complaintId: id,
        previousStatus: oldStatus,
        newStatus: status,
        changedById: userId
      }
    });

    // Create notifications based on status change
    if (status === ComplaintStatus.ASSIGNED) {
      // Notify the assigned agent
      if (assignedAgentId) {
        await createNotification({
          type: "COMPLAINT_ASSIGNED",
          title: "Complaint Assigned to You",
          message: `You have been assigned to handle complaint: "${updatedComplaint.title}"`,
          entityType: "complaint",
          entityId: id,
          userId: assignedAgentId
        });
      }
    } else if (status === ComplaintStatus.RESOLVED || status === ComplaintStatus.CLOSED) {
      // Notify the complaint submitter
      await createNotification({
        type: "COMPLAINT_UPDATED",
        title: `Complaint ${status === ComplaintStatus.RESOLVED ? 'Resolved' : 'Closed'}`,
        message: `Your complaint "${updatedComplaint.title}" has been ${status === ComplaintStatus.RESOLVED ? 'resolved' : 'closed'}.`,
        entityType: "complaint",
        entityId: id,
        userId: currentComplaint.submittedById
      });
    }
  }

  return updatedComplaint as any;
}

/**
 * Delete a complaint
 */
export async function deleteComplaint(id: string): Promise<{ success?: boolean; error?: string }> {
  try {
    await db.complaint.delete({
      where: { id }
    });
    revalidatePath("/complaints");
    return { success: true };
  } catch (error: any) {
    console.error("[DELETE_COMPLAINT_ERROR]", error);
    return { error: error.message || "Failed to delete complaint." };
  }
}

/**
 * Add a comment to a complaint
 */
export async function addComment(data: { complaintId: string; text: string; isInternal?: boolean }, userId: string): Promise<{ success?: boolean; error?: string; comment?: any }> {
  try {
    const { complaintId, text, isInternal = false } = data;

    const comment = await db.comment.create({
      data: {
        text,
        isInternal,
        complaint: { connect: { id: complaintId } },
        user: { connect: { id: userId } }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Get complaint details
    const complaint = await db.complaint.findUnique({
      where: { id: complaintId },
      select: {
        title: true,
        submittedById: true,
        assignedAgentId: true
      }
    });

    if (complaint) {
      // If internal comment, notify only team members
      if (isInternal) {
        // Notify assigned agent if comment was made by someone else
        if (complaint.assignedAgentId && complaint.assignedAgentId !== userId) {
          await createNotification({
            type: "COMPLAINT_UPDATED",
            title: "Internal Comment Added",
            message: `An internal comment was added to complaint: "${complaint.title}"`,
            entityType: "complaint",
            entityId: complaintId,
            userId: complaint.assignedAgentId
          });
        }
      } else {
        // For public comments

        // Notify submitter if comment was made by staff
        if (complaint.submittedById !== userId) {
          await createNotification({
            type: "COMPLAINT_UPDATED",
            title: "New Comment on Your Complaint",
            message: `A new comment was added to your complaint: "${complaint.title}"`,
            entityType: "complaint",
            entityId: complaintId,
            userId: complaint.submittedById
          });
        }

        // Notify assigned agent if comment was made by submitter
        if (complaint.assignedAgentId && complaint.submittedById === userId) {
          await createNotification({
            type: "COMPLAINT_UPDATED",
            title: "Customer Added Comment",
            message: `The customer added a new comment to complaint: "${complaint.title}"`,
            entityType: "complaint",
            entityId: complaintId,
            userId: complaint.assignedAgentId
          });
        }
      }
    }

    revalidatePath(`/complaints/${complaintId}`);
    return { success: true, comment };
  } catch (error: any) {
    console.error("[ADD_COMMENT_ERROR]", error);
    return { error: error.message || "Failed to add comment." };
  }
}


/**
 * Get complaint statistics
 */
export async function getComplaintStatistics(filters?: ComplaintFilters): Promise<any> {
  const complaints = await db.complaint.findMany({
    where: filters?.where,
    include: {
      service: true,
      provider: true,
    },
  });
  return calculateStatistics(complaints);
}