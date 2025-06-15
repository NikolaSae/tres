// data/complaint.ts
import { db } from "@/lib/db";

export const getComplaintById = async (id: string) => {
  try {
    const complaint = await db.complaint.findUnique({
      where: { id },
      include: {
        user: true,
        product: true,
        assignedTo: {
          select: {
            id: true,
            name: true, // Fetch the name of the assigned user
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
        history: {
          include: {
            user: true,
          },
          orderBy: {
            createdAt: "desc",
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
      where: { userId },
      include: {
        product: true,
        assignedTo: {
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
        user: true,
        product: true,
        assignedTo: {
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
      where: { assignedTo: userId },
      include: {
        user: true,
        product: true,
        assignedTo: {
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
      where: { id: complaintId }, // ID reklamacije koju želite da ažurirate
      data: {
        assignedToId: userId, // Novi korisnik kojem je dodeljena reklamacija
        status: "IN_PROGRESS", // Opcionalno: možete ažurirati i status reklamacije
      },
    });

    return updatedComplaint; // Vraća ažuriranu reklamaciju
  } catch (error) {
    console.error("[ASSIGN_COMPLAINT_TO_USER]", error);
    throw new Error("Došlo je do greške prilikom ažuriranja reklamacije.");
  }
};