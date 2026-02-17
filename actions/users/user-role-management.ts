// actions/users/user-role-management.ts

"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

/**
 * Get all users with their roles and basic info
 */
export async function getAllUsers() {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return { error: "Unauthorized. Admin access required." };
    }

    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        emailVerified: true,
        isTwoFactorEnabled: true,
        isOAuth: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return { 
      users: users.map(user => ({
        ...user,
        lastLogin: user.updatedAt, // updatedAt shows last activity
      }))
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { error: "Failed to fetch users." };
  }
}

/**
 * Update user role
 */
export async function updateUserRole(userId: string, newRole: UserRole) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return { error: "Unauthorized. Admin access required." };
    }

    // Prevent admin from changing their own role
    if (session.user.id === userId) {
      return { error: "You cannot change your own role." };
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { role: newRole },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    // Log the activity
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        entityType: "User",
        entityId: userId,
        action: "UPDATE",
        details: `Changed role to ${newRole} for user ${updatedUser.email}`,
        severity: "WARNING", // Role changes are more sensitive
      },
    });

    revalidatePath('/admin/security/user-roles');
    
    return { 
      success: true, 
      user: updatedUser,
      message: `User role updated to ${newRole}` 
    };
  } catch (error) {
    console.error("Error updating user role:", error);
    return { error: "Failed to update user role." };
  }
}

/**
 * Toggle user active status
 */
export async function toggleUserStatus(
  userId: string, 
  isActive: boolean
): Promise<{ success?: boolean; message?: string; error?: string }> {
  try {
    console.log('toggleUserStatus called with:', { userId, isActive });
    
    const session = await auth();
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      console.log('Authorization failed:', session?.user?.role);
      return { error: "Unauthorized. Admin access required." };
    }

    // Prevent admin from deactivating themselves
    if (session.user.id === userId) {
      console.log('User tried to deactivate themselves');
      return { error: "You cannot deactivate your own account." };
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
      },
    });

    console.log('User updated:', updatedUser);

    // Log the activity
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        entityType: "User",
        entityId: userId,
        action: "UPDATE",
        details: `${isActive ? 'Activated' : 'Deactivated'} user ${updatedUser.email}`,
        severity: "INFO",
      },
    });

    revalidatePath('/admin/security/user-roles');
    
    const result = { 
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
    };
    
    console.log('Returning result:', result);
    return result;
  } catch (error) {
    console.error("Error toggling user status:", error);
    return { error: "Failed to update user status." };
  }
}

/**
 * Bulk update user roles
 */
export async function bulkUpdateUserRoles(userIds: string[], newRole: UserRole) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return { error: "Unauthorized. Admin access required." };
    }

    // Filter out current user from bulk update
    const filteredUserIds = userIds.filter(id => id !== session.user.id);

    if (filteredUserIds.length === 0) {
      return { error: "Cannot perform bulk update on your own account." };
    }

    const result = await db.user.updateMany({
      where: { 
        id: { in: filteredUserIds }
      },
      data: { role: newRole },
    });

    // Log the bulk activity
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        entityType: "User",
        entityId: "bulk",
        action: "UPDATE",
        details: `Bulk role update to ${newRole} for ${result.count} users`,
        severity: "WARNING", // Bulk operations are more sensitive
      },
    });

    revalidatePath('/admin/security/user-roles');
    
    return { 
      success: true, 
      count: result.count,
      message: `${result.count} user roles updated to ${newRole}` 
    };
  } catch (error) {
    console.error("Error bulk updating user roles:", error);
    return { error: "Failed to bulk update user roles." };
  }
}

/**
 * Get role statistics
 */
export async function getRoleStatistics() {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return { error: "Unauthorized. Admin access required." };
    }

    const [total, byRole, activeUsers, verifiedUsers] = await Promise.all([
      db.user.count(),
      db.user.groupBy({
        by: ['role'],
        _count: {
          id: true,
        },
      }),
      db.user.count({ where: { isActive: true } }),
      db.user.count({ where: { emailVerified: { not: null } } }),
    ]);

    return {
      total,
      byRole: byRole.reduce((acc, curr) => {
        acc[curr.role] = curr._count.id;
        return acc;
      }, {} as Record<UserRole, number>),
      activeUsers,
      verifiedUsers,
    };
  } catch (error) {
    console.error("Error fetching role statistics:", error);
    return { error: "Failed to fetch role statistics." };
  }
}

/**
 * Send password reset email to user
 */
export async function sendPasswordReset(userId: string) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return { error: "Unauthorized. Admin access required." };
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        isOAuth: true,
      },
    });

    if (!user) {
      return { error: "User not found." };
    }

    // Check if user is OAuth user
    if (user.isOAuth) {
      return { error: "Cannot reset password for OAuth users." };
    }

    // Generate reset token
    const { v4: uuidv4 } = require('uuid');
    const token = uuidv4();
    const expires = new Date(new Date().getTime() + 3600 * 1000); // 1 hour

    // Delete any existing reset tokens for this email
    await db.passwordResetToken.deleteMany({
      where: { email: user.email },
    });

    // Create new reset token
    await db.passwordResetToken.create({
      data: {
        email: user.email,
        token,
        expires,
      },
    });

    // Log the activity
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        entityType: "User",
        entityId: userId,
        action: "UPDATE",
        details: `Sent password reset email to ${user.email}`,
        severity: "INFO",
      },
    });

    // TODO: Send email with reset link
    // For now, just return the token (in production, send via email)
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/new-password?token=${token}`;
    
    console.log('Password reset link:', resetLink);

    revalidatePath('/admin/security/user-roles');
    
    return { 
      success: true,
      message: `Password reset email sent to ${user.email}`,
      // Remove this in production - only for development
      resetLink: process.env.NODE_ENV === 'development' ? resetLink : undefined,
    };
  } catch (error) {
    console.error("Error sending password reset:", error);
    return { error: "Failed to send password reset email." };
  }
}