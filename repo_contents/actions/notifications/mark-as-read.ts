///actions/notifications/mark-as-read.ts


"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Schema for validation
const MarkAsReadSchema = z.object({
  id: z.string().optional(),
  markAllAsRead: z.boolean().optional()
});

export type MarkAsReadInput = z.infer<typeof MarkAsReadSchema>;

export async function markAsRead(data: MarkAsReadInput) {
  try {
    const validatedData = MarkAsReadSchema.parse(data);
    
    // Get the current user
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }
    
    const userId = session.user.id;
    
    // If marking all as read
    if (validatedData.markAllAsRead) {
      await db.notification.updateMany({
        where: {
          userId,
          isRead: false
        },
        data: {
          isRead: true
        }
      });
      
      revalidatePath("/notifications");
      return { success: "All notifications marked as read" };
    }
    
    // If marking a specific notification as read
    if (validatedData.id) {
      const notification = await db.notification.findUnique({
        where: {
          id: validatedData.id
        }
      });
      
      // Check if notification exists and belongs to the user
      if (!notification || notification.userId !== userId) {
        return { error: "Notification not found" };
      }
      
      await db.notification.update({
        where: {
          id: validatedData.id
        },
        data: {
          isRead: true
        }
      });
      
      revalidatePath("/notifications");
      return { success: "Notification marked as read" };
    }
    
    return { error: "No action specified" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: "Invalid input data" };
    }
    
    return { error: "Failed to mark notification as read" };
  }
}