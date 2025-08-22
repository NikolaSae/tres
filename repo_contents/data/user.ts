// data/user.ts
import { db } from "@/lib/db";

export const getUserByEmail = async (email: string) => {
  try {
    const user = await db.user.findUnique({ where: { email } });
    return user;
  } catch {
    return null;
  }
};

export const getUserById = async (id: string) => {
  try {
    const user = await db.user.findUnique({ where: { id } });
    return user;
  } catch {
    return null;
  }
};

// New function to get all users
export const getAllUsers = async () => {
  try {
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    return users;
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return [];
  }
};
// Function to fetch a user by assignedToId
export const getUserByAssignedToId = async (assignedToId: string) => {
  try {
    const user = await db.user.findUnique({
      where: { id: assignedToId },
      select: {
        id: true,
        name: true,
      },
    });

    return user;
  } catch (error) {
    console.error("Failed to fetch user by assignedTo:", error);
    return null;
  }
};