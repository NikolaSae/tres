// Path: actions/notifications/get-by-user-id.ts
"use server";

import { db } from "@/lib/db"; // Assuming your Prisma client is imported from here
import { auth } from "@/auth"; // Assuming your auth config is here
import { Notification } from "@/lib/types/notification-types"; // Import your Notification type
import { UserRole } from "@prisma/client"; // Import UserRole if used for checks

/**
 * Fetches notifications for a specific user ID.
 * Includes basic authorization check to ensure the user is authenticated.
 * Note: For stricter security, you might want to ensure the user requesting
 * notifications is the owner of those notifications, unless they have an admin/manager role.
 * @param userId - The ID of the user whose notifications to fetch.
 * @returns A promise resolving to an array of Notification objects or an error object.
 */
export async function getNotificationsByUserId(userId: string): Promise<Notification[] | { error: string }> {
  try {
    // Optional: Basic check if the requesting user is authenticated
    // For stricter checks (e.g., user can only fetch their own notifications),
    // you'd compare session.user.id with the requested userId.
    const session = await auth();
    if (!session || !session.user) {
      return { error: "Unauthorized" };
    }

    // Optional stricter check: Allow Admin/Manager to fetch for any user,
    // but other roles only for their own ID.
    // if (session.user.id !== userId && session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.MANAGER) {
    //     return { error: "Unauthorized to view these notifications" };
    // }


    // Fetch notifications from the database for the given user ID
    // Adjust include/select based on what data you need in the NotificationList component
    const notifications = await db.notification.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: 'desc', // Order by creation date, newest first
      },
      // If your Notification type includes relations, you might need 'include' here
      // include: {
      //     relatedEntity: true, // Example: if notifications link to other models
      // }
    });

    // Cast the result to your defined Notification type
    // Prisma's generated types should be compatible with your lib/types definition
    return notifications as Notification[];

  } catch (error) {
    console.error(`Error fetching notifications for user ${userId}:`, error);
    return { error: "Failed to fetch notifications." };
  }
}
