// /actions/complaints/create.ts
"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const createComplaintSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title cannot exceed 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  serviceId: z.string().optional().nullable(),
  productId: z.string().optional().nullable(),
  providerId: z.string().optional().nullable(),
  priority: z.number().min(1).max(5).default(3),
  financialImpact: z.number().optional().nullable(),
});

export type CreateComplaintFormData = z.infer<typeof createComplaintSchema>;

export async function createComplaint(data: CreateComplaintFormData) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return {
        error: "Unauthorized. Please sign in to create a complaint.",
        success: false
      };
    }
    
    console.log("Session user in createComplaint:", session.user);
    
    let userId = session.user.id;
    if (!userId && session.user.email) {
      const user = await db.user.findUnique({
        where: { email: session.user.email }
      });
      
      if (!user) {
        return {
          error: "User not found. Please sign in again.",
          success: false
        };
      }
      
      userId = user.id;
    }
    
    if (!userId) {
      return {
        error: "User ID is missing. Please sign in again.",
        success: false
      };
    }

    const validatedData = createComplaintSchema.parse(data);

    // Create the complaint with scalar fields
    const complaint = await db.complaint.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        priority: validatedData.priority,
        financialImpact: validatedData.financialImpact || null,
        serviceId: validatedData.serviceId || null,
        productId: validatedData.productId || null,
        providerId: validatedData.providerId || null,
        submittedById: userId
      },
    });

    // Create initial status history entry with scalar fields
    await db.complaintStatusHistory.create({
      data: {
        complaintId: complaint.id,
        newStatus: "NEW",
        changedById: userId
      },
    });

    // Log the activity with scalar field
    await db.activityLog.create({
      data: {
        action: "COMPLAINT_CREATED",
        entityType: "complaint",
        entityId: complaint.id,
        details: `Complaint created: ${complaint.title}`,
        userId: userId
      },
    });

    // Create notifications for managers
    const managers = await db.user.findMany({
      where: {
        role: { in: ["ADMIN", "MANAGER"] },
        isActive: true
      },
      select: { id: true }
    });

    const notificationPromises = managers.map(manager => 
      db.notification.create({
        data: {
          title: "New Complaint Submitted",
          message: `A new complaint "${complaint.title}" has been submitted.`,
          type: "COMPLAINT_UPDATED",
          userId: manager.id,
          entityType: "complaint",
          entityId: complaint.id,
        },
      })
    );

    await Promise.all(notificationPromises);

    revalidatePath("/complaints");
    
    return {
      success: true,
      complaint: complaint,
      message: "Complaint created successfully!"
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: "Validation failed",
        formErrors: error.format(),
        success: false
      };
    }
    
    console.error("[COMPLAINT_CREATE_ERROR]", error);
    
    return {
      error: "Failed to create complaint. Please try again.",
      success: false
    };
  }
}