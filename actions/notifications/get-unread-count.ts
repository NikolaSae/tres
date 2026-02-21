//actions/notifications/get-unread-count.ts

"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";

/**
 * Gets the count of unread notifications for the current user
 */
export async function getUnreadNotificationCount(): Promise<number | { error: string }> {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }
    
    const count = await db.notification.count({
      where: {
        userId: session.user.id,
        isRead: false,
      },
    });
    
    return count;
  } catch (error) {
    console.error("Error fetching unread notification count:", error);
    return { error: "Failed to fetch notification count" };
  }
}