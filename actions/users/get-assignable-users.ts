// Path: actions/users/get-assignable-users.ts
"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";

/**
 * Fetches a list of users who can be assigned to a complaint (Admins and Agents).
 * Only accessible by Admin and Manager roles.
 * @returns A promise resolving to an array of assignable users (id, name) or an error object.
 */
export async function getAssignableUsers() {
  try {
    const session = await auth();

    // Check if the user is authenticated and has the necessary role (Admin or Manager)
    if (!session || !session.user || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.MANAGER)) {
      return { error: "Unauthorized" };
    }

    // Fetch users with ADMIN or AGENT roles
    const assignableUsers = await db.user.findMany({
      where: {
        role: {
          in: [UserRole.ADMIN, UserRole.AGENT],
        },
      },
      select: {
        id: true,
        name: true,
        // You might include email or other relevant fields if needed
      },
      orderBy: {
        name: 'asc', // Order by name for easier selection
      },
    });

    return { users: assignableUsers };

  } catch (error) {
    console.error("Error fetching assignable users:", error);
    return { error: "Failed to fetch assignable users." };
  }
}
