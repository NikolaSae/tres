// /actions/complaints/comment.ts
"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const commentSchema = z.object({
  complaintId: z.string().min(1),
  text: z.string().min(1, "Comment text is required"),
  isInternal: z.boolean().default(false),
});

export type CommentFormData = z.infer<typeof commentSchema>;

export async function addComment(data: CommentFormData) {
  try {
    const session = await auth();
    if (!session?.user) {
      return {
        error: "Unauthorized. Please sign in to add a comment.",
      };
    }

    const validatedData = commentSchema.parse(data);

    // Check if complaint exists
    const complaint = await db.complaint.findUnique({
      where: { id: validatedData.complaintId },
    });

    if (!complaint) {
      return {
        error: "Complaint not found",
      };
    }

    // Check user permissions for internal comments
    if (validatedData.isInternal) {
      const user = await db.user.findUnique({
        where: { id: session.user.id },
      });
      
      if (user?.role !== "ADMIN" && user?.role !== "MANAGER" && user?.role !== "AGENT") {
        return {
          error: "Not authorized to create internal comments",
        };
      }
    }

    // Create the comment
    const comment = await db.comment.create({
      data: {
        text: validatedData.text,
        isInternal: validatedData.isInternal,
        complaintId: validatedData.complaintId,
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    // Log the activity
    await db.activityLog.create({
      data: {
        action: "COMMENT_ADDED",
        entityType: "complaint",
        entityId: validatedData.complaintId,
        details: `Comment added to complaint #${validatedData.complaintId}`,
        userId: session.user.id,
      },
    });

    // Create notifications for relevant parties
    const notificationTargets = new Set<string>();
    
    // Add submitter if not the commenter and comment is not internal
    if (complaint.submittedById !== session.user.id && !validatedData.isInternal) {
      notificationTargets.add(complaint.submittedById);
    }
    
    // Add assigned agent if exists and not the commenter
    if (complaint.assignedAgentId && complaint.assignedAgentId !== session.user.id) {
      notificationTargets.add(complaint.assignedAgentId);
    }
    
    // Create notifications
    const notificationPromises = Array.from(notificationTargets).map(userId => 
      db.notification.create({
        data: {
          title: "New Comment on Complaint",
          message: `A new comment has been added to complaint "${complaint.title}".`,
          type: "COMPLAINT_UPDATED",
          userId,
          entityType: "complaint",
          entityId: validatedData.complaintId,
        },
      })
    );

    await Promise.all(notificationPromises);

    revalidatePath(`/complaints/${validatedData.complaintId}`);
    
    return { success: true, comment };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.format();
      
      return {
        error: "Validation failed",
        formErrors: formattedErrors,
      };
    }
    
    console.error("[COMMENT_ADD_ERROR]", error);
    
    return {
      error: "Failed to add comment. Please try again.",
    };
  }
}