///actions/security/check-permission.ts
"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { LogSeverity, UserRole } from "@prisma/client";
import { PERMISSIONS } from "@/lib/security/permissions";
import { logActivity } from "@/lib/security/audit-logger";

/**
 * Check if a user has a specific permission
 */
export async function checkPermission(
  permissionName: string,
  userId?: string
): Promise<boolean> {
  try {
    let user: {
      id: string;
      role: UserRole;
      isActive: boolean;
    } | null = null;

    if (userId) {
      user = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          role: true,
          isActive: true,
        },
      });
    } else {
      const session = await auth();

      if (!session?.user) {
        return false;
      }

      user = {
        id: session.user.id,
        role: session.user.role as UserRole,
        isActive: session.user.isActive ?? true,
      };
    }

    if (!user || !user.isActive) {
      return false;
    }

    const permission = PERMISSIONS.find(
      (p) => p.name === permissionName
    );

    if (!permission) {
      await logActivity("permission_check_failed", {
        entityType: "permission",
        entityId: permissionName,
        details: `Permission "${permissionName}" does not exist`,
        severity: LogSeverity.WARNING,
        userId: user.id,
      });
      return false;
    }

    const hasPermission = permission.roles.includes(user.role);

    const sensitivePermissions = [
      "delete_contract",
      "delete_provider",
      "manage_permissions",
      "change_user_role",
      "delete_user",
      "view_financial_analytics",
    ];

    if (sensitivePermissions.includes(permissionName)) {
      await logActivity(
        hasPermission ? "permission_granted" : "permission_denied",
        {
          entityType: "permission",
          entityId: permissionName,
          details: `User ${
            hasPermission ? "has" : "does not have"
          } permission "${permissionName}"`,
          severity: hasPermission
            ? LogSeverity.INFO
            : LogSeverity.WARNING,
          userId: user.id,
        }
      );
    }

    return hasPermission;
  } catch (error) {
    console.error("checkPermission error:", error);
    return false;
  }
}

/**
 * Throws if the current user does not have the permission
 */
export async function requirePermission(
  permissionName: string
): Promise<void> {
  const allowed = await checkPermission(permissionName);

  if (!allowed) {
    throw new Error("You don't have permission to perform this action");
  }
}
