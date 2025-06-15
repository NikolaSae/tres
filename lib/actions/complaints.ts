// lib/actions/complaints.ts
"use server"; // Dodat "use server" direktiva ako nedostaje

// ISPRAVLJENO: Uvezen db iz lib/db
import { db } from "@/lib/db";
import { auth } from "@/auth"; // Proverite putanju za auth
import { z } from "zod"; // Uvezeno z ako se koristi negde drugde
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation"; // Uvezeno redirect ako se koristi negde drugde
// Uvezen ComplaintStatus direktno iz Prisma klijenta ako je to izvor istine
import { ComplaintStatus } from "@prisma/client";

// Uvezeni potrebni tipovi (pretpostavljamo da su definisani ovde)
import { Complaint, ComplaintFilters, CreateComplaintData, UpdateComplaintData } from "@/lib/types/interfaces";

// Uvezeni helperi iz utils
import { createNotification } from "@/utils/complaint-notification"; // Proverite putanju
// ISPRAVLJENO: Uvezeno calculateStatistics i detectAnomalies iz utils/complaint-statistics
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
    // Proveravamo da li su datumi validni pre dodavanja u where klauzulu
    if (startDate && !isNaN(new Date(startDate).getTime())) where.createdAt.gte = startDate;
    if (endDate && !isNaN(new Date(endDate).getTime())) where.createdAt.lte = endDate;
    // Ako ni startDate ni endDate nisu validni, uklanjamo createdAt filter
    if (Object.keys(where.createdAt).length === 0) delete where.createdAt;
  }

  // Search functionality (searching in title and description)
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  // Execute query using db.complaint
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
      // Uklonjeno 'comments' i '_count' iz include u getComplaints
      // Ovi podaci se verovatno ne koriste na list stranici i mogu usporiti upit
      // Ako su potrebni, vratite ih, ali razmislite o performansama
      // comments: {
      //   orderBy: {
      //     createdAt: 'desc'
      //   },
      //   take: 1 // Dohvata samo poslednji komentar
      // },
      // _count: {
      //   select: {
      //     comments: true,
      //     attachments: true
      //   }
      // }
    },
    orderBy: {
      [sortBy]: sortOrder as any // Dodat 'as any' zbog potencijalne TypeScript greške sa dinamičkim ključem
    },
    take: limit,
    skip: offset
  });

  return complaints as Complaint[]; // Kastujemo rezultat u Complaint[]
}

/**
 * Get a complaint by its ID
 */
export async function getComplaintById(id: string): Promise<Complaint | null> {
  // Execute query using db.complaint
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

  return complaint as Complaint | null; // Kastujemo rezultat
}

/**
 * Create a new complaint
 */
export async function createComplaint(data: CreateComplaintData, userId: string): Promise<Complaint> {
  const { title, description, serviceId, productId, providerId, priority, financialImpact } = data;

  // Execute query using db.complaint
  const complaint = await db.complaint.create({
    data: {
      title,
      description,
      priority: priority || 3, // Default priority is medium (3)
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
    type: "COMPLAINT_UPDATED", // Proverite da li je ovo ispravan tip notifikacije
    title: "New Complaint Submitted",
    message: `A new complaint "${complaint.title}" has been submitted and needs assignment.`,
    entityType: "complaint",
    entityId: complaint.id,
    roles: ["ADMIN", "MANAGER"]
  });

  // Check for anomalies
  // ISPRAVLJENO: Pozivamo detectAnomalies direktno (uvezenu iz utils/complaint-statistics)
  const anomalies = detectAnomalies([complaint]); // Šaljemo niz sa samo novom pritužbom za detekciju
  if (anomalies.length > 0) {
    await createNotification({
      type: "SYSTEM",
      title: "Potential Anomaly Detected",
      message: `Complaint "${complaint.title}" may require special attention: ${anomalies.map(a => a.description).join(", ")}`, // Formatiramo anomalije
      entityType: "complaint",
      entityId: complaint.id,
      roles: ["ADMIN", "MANAGER"]
    });
  }

  return complaint as Complaint; // Kastujemo rezultat
}

/**
 * Update an existing complaint
 */
export async function updateComplaint(id: string, data: UpdateComplaintData, userId: string): Promise<Complaint> {
  const { title, description, status, priority, financialImpact, serviceId, productId, providerId, assignedAgentId } = data;

  // Get the current status to track changes
  // Execute query using db.complaint
  const currentComplaint = await db.complaint.findUnique({
    where: { id },
    select: { status: true, submittedById: true, assignedAgentId: true, title: true } // Dohvatamo i submittedById, assignedAgentId, title
  });

  if (!currentComplaint) {
    throw new Error("Complaint not found"); // Bacamo grešku ako pritužba ne postoji
  }

  let statusChanged = false;
  let oldStatus: ComplaintStatus | null = null;

  if (status && currentComplaint.status !== status) {
    statusChanged = true;
    oldStatus = currentComplaint.status;
  }

  // Update the complaint
  // Execute query using db.complaint
  const updatedComplaint = await db.complaint.update({
    where: { id },
    data: {
      title,
      description,
      status,
      priority,
      financialImpact,
      // Ažuriramo datume samo ako se status menja na odgovarajući
      assignedAt: status === ComplaintStatus.ASSIGNED ? new Date() : undefined,
      resolvedAt: status === ComplaintStatus.RESOLVED ? new Date() : undefined,
      closedAt: status === ComplaintStatus.CLOSED ? new Date() : undefined,
      service: serviceId ? { connect: { id: serviceId } } : undefined,
      product: productId ? { connect: { id: productId } } : undefined,
      provider: providerId ? { connect: { id: providerId } } : undefined,
      assignedAgent: assignedAgentId ? { connect: { id: assignedAgentId } } : undefined,
      lastModifiedById: userId
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
    // Execute query using db.complaintStatusHistory
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
        type: "COMPLAINT_UPDATED", // Proverite da li je ovo ispravan tip notifikacije
        title: `Complaint ${status === ComplaintStatus.RESOLVED ? 'Resolved' : 'Closed'}`,
        message: `Your complaint "${updatedComplaint.title}" has been ${status === ComplaintStatus.RESOLVED ? 'resolved' : 'closed'}.`,
        entityType: "complaint",
        entityId: id,
        userId: updatedComplaint.submittedBy.id
      });
    }
  }

  return updatedComplaint as Complaint; // Kastujemo rezultat
}

/**
 * Delete a complaint
 */
// ISPRAVLJENO: Akcija vraća objekat sa success/error za bolji handling na klijentu
export async function deleteComplaint(id: string): Promise<{ success?: boolean; error?: string }> {
  try {
    // Execute query using db.complaint
    await db.complaint.delete({
      where: { id }
    });
    revalidatePath("/complaints"); // Revalidiramo listu nakon brisanja
    return { success: true };
  } catch (error: any) {
    console.error("[DELETE_COMPLAINT_ERROR]", error);
    return { error: error.message || "Failed to delete complaint." };
  }
}

/**
 * Add a comment to a complaint
 */
// ISPRAVLJENO: Akcija prihvata objekat i vraća objekat sa success/error/comment
export async function addComment(data: { complaintId: string; text: string; isInternal?: boolean }, userId: string): Promise<{ success?: boolean; error?: string; comment?: any }> {
  try {
    const { complaintId, text, isInternal = false } = data;

    // Execute query using db.comment
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
    // Execute query using db.complaint
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
            type: "COMPLAINT_UPDATED", // Proverite tip notifikacije
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
            type: "COMPLAINT_UPDATED", // Proverite tip notifikacije
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
            type: "COMPLAINT_UPDATED", // Proverite tip notifikacije
            title: "Customer Added Comment",
            message: `The customer added a new comment to complaint: "${complaint.title}"`,
            entityType: "complaint",
            entityId: complaintId,
            userId: complaint.assignedAgentId
        });
      }
    }
  }

    revalidatePath(`/complaints/${complaintId}`); // Revalidiramo stranicu detalja
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
  // Execute query using db.complaint
  const complaints = await db.complaint.findMany({
    where: filters?.where, // Pretpostavljamo da calculateStatistics akcija prima where klauzulu
    include: { // Uključujemo relacije potrebne za statistike
      service: true,
      provider: true,
    },
  });
  // ISPRAVLJENO: Pozivamo calculateStatistics direktno (uvezenu iz utils/complaint-statistics)
  return calculateStatistics(complaints);
}

// Napomena: Akcija changeComplaintStatus se verovatno nalazi u drugom fajlu, npr. actions/complaints/change-status.ts
// Nismo je ovde menjali jer nije bila priložena u ovom zahtevu, ali je važno da i ona koristi db.complaint umesto prisma.complaint
