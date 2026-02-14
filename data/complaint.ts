// data/complaint.ts
import { db } from "@/lib/db";

export const getComplaintById = async (id: string) => {
  try {
    const complaint = await db.complaint.findUnique({
      where: { id },
      include: {
        submittedBy: true, // ✅ Changed from 'user' to 'submittedBy'
        product: true,
        assignedAgent: { // ✅ Changed from 'assignedTo' to 'assignedAgent'
          select: {
            id: true,
            name: true,
          },
        },
        comments: {
          include: {
            user: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        attachments: true,
        statusHistory: { // ✅ Changed from 'history' to 'statusHistory'
          orderBy: {
            changedAt: "desc", // ✅ Changed from 'createdAt' to 'changedAt'
          },
        },
      },
    });

    console.log("Complaint fetched for ID:", id, complaint);
    return complaint;
  } catch (error) {
    console.error("[GET_COMPLAINT_BY_ID]", error);
    throw error;
  }
};

export const getComplaintsByUserId = async (userId: string) => {
  try {
    const complaints = await db.complaint.findMany({
      where: { submittedById: userId }, // ✅ Changed from 'userId' to 'submittedById'
      include: {
        product: true,
        assignedAgent: { // ✅ Changed from 'assignedTo' to 'assignedAgent'
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return complaints;
  } catch (error) {
    console.error("[GET_COMPLAINTS_BY_USER]", error);
    return [];
  }
};

export const getAllComplaints = async () => {
  try {
    const complaints = await db.complaint.findMany({
      include: {
        submittedBy: true, // ✅ Changed from 'user' to 'submittedBy'
        product: true,
        assignedAgent: { // ✅ Changed from 'assignedTo' to 'assignedAgent'
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    return complaints;
  } catch (error) {
    console.error("[GET_ALL_COMPLAINTS]", error);
    return [];
  }
};

export const getAssignedComplaints = async (userId: string) => {
  try {
    const complaints = await db.complaint.findMany({
      where: { assignedAgentId: userId }, // ✅ Changed from 'assignedTo' to 'assignedAgentId'
      include: {
        submittedBy: true, // ✅ Changed from 'user' to 'submittedBy'
        product: true,
        assignedAgent: { // ✅ Changed from 'assignedTo' to 'assignedAgent'
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    return complaints;
  } catch (error) {
    console.error("[GET_ASSIGNED_COMPLAINTS]", error);
    return [];
  }
};

export const assignComplaintToUser = async (complaintId: string, userId: string) => {
  try {
    const updatedComplaint = await db.complaint.update({
      where: { id: complaintId },
      data: {
        assignedAgentId: userId, // ✅ Changed from 'assignedToId' to 'assignedAgentId'
        status: "IN_PROGRESS",
      },
    });

    return updatedComplaint;
  } catch (error) {
    console.error("[ASSIGN_COMPLAINT_TO_USER]", error);
    throw new Error("Došlo je do greške prilikom ažuriranja reklamacije.");
  }
};