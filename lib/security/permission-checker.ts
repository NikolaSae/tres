
// lib/security/permission-checker.ts
"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "./auth-helpers";
import { getPermissionsForRole } from "./permissions";
import { UserRole } from "@prisma/client";

// ═══════════════════════════════════════════════════════════════
// OLD SYSTEM (kept for backward compatibility)
// ═══════════════════════════════════════════════════════════════

type EntityType = "contract" | "complaint" | "service" | "provider" |
                 "humanitarian" | "report" | "user" | "analytics";

type ActionType = "view" | "create" | "update" | "delete";

const rolePermissionMap: Record<UserRole, Record<EntityType, ActionType[]>> = {
    ADMIN: {
        contract: ["view", "create", "update", "delete"],
        complaint: ["view", "create", "update", "delete"],
        service: ["view", "create", "update", "delete"],
        provider: ["view", "create", "update", "delete"],
        humanitarian: ["view", "create", "update", "delete"],
        report: ["view", "create", "update", "delete"],
        user: ["view", "create", "update", "delete"],
        analytics: ["view"],
    },
    MANAGER: {
        contract: ["view", "create", "update"],
        complaint: ["view", "create", "update"],
        service: ["view", "create", "update"],
        provider: ["view", "create", "update"],
        humanitarian: ["view", "create", "update"],
        report: ["view", "create", "update"],
        user: ["view"],
        analytics: ["view"],
    },
    AGENT: {
        contract: ["view"],
        complaint: ["view", "create", "update"],
        service: ["view"],
        provider: ["view"],
        humanitarian: ["view"],
        report: ["view"],
        user: ["view"],
        analytics: [],
    },
    USER: {
        contract: [],
        complaint: ["view", "create"],
        service: ["view"],
        provider: ["view"],
        humanitarian: ["view"],
        report: [],
        user: [],
        analytics: [],
    },
};

export async function canPerformAction(
    entityType: EntityType,
    action: ActionType,
    entityId?: string
): Promise<boolean> {
    const user = await getCurrentUser();
    if (!user || !user.role) return false;

    const userRole = user.role as UserRole;
    if (!rolePermissionMap[userRole] || !rolePermissionMap[userRole][entityType]) {
         return false;
    }

    const allowedActions = rolePermissionMap[userRole][entityType] || [];

    if (!allowedActions.includes(action)) {
        return false;
    }

    if (entityId && entityType === "complaint" && action === "update" && userRole === UserRole.USER) {
        const complaint = await db.complaint.findUnique({
            where: { id: entityId }
        });

        return complaint?.submittedById === user.id;
    }

    return true;
}

// ═══════════════════════════════════════════════════════════════
// NEW SYSTEM (using permissions.ts)
// ═══════════════════════════════════════════════════════════════

/**
 * Check if current user has a specific permission (new system)
 */
async function hasPermission(permissionName: string): Promise<boolean> {
  const user = await getCurrentUser();
  
  if (!user?.role) {
    return false;
  }

  const userPermissions = getPermissionsForRole(user.role as UserRole);
  return userPermissions.includes(permissionName);
}

// ═══════════════════════════════════════════════════════════════
// ANALYTICS PERMISSIONS (using OLD system for now)
// ═══════════════════════════════════════════════════════════════

export const canAccessAnalyticsPage = async (): Promise<boolean> => {
    const user = await getCurrentUser();
    if (!user || !user.role) return false;
    const userRole = user.role as UserRole;
    return rolePermissionMap[userRole]?.['analytics']?.includes('view') || false;
};

export const canViewComplaintData = async (): Promise<boolean> => {
    return canPerformAction('analytics', 'view');
};

export const canViewFinancialData = async (): Promise<boolean> => {
    return canPerformAction('analytics', 'view');
};

export const canViewSalesData = async (): Promise<boolean> => {
    return canPerformAction('analytics', 'view');
};

export const canViewProviderData = async (): Promise<boolean> => {
    return canPerformAction('analytics', 'view');
};

// ═══════════════════════════════════════════════════════════════
// REPORTS PERMISSIONS
// ═══════════════════════════════════════════════════════════════

export async function canGenerateReports(): Promise<boolean> {
    return canPerformAction('report', 'create');
}

export async function canScheduleReports(): Promise<boolean> {
    return canPerformAction('report', 'create');
}

export async function canViewReports(): Promise<boolean> {
    return canPerformAction('report', 'view');
}

// ═══════════════════════════════════════════════════════════════
// SERVICES PERMISSIONS
// ═══════════════════════════════════════════════════════════════

export async function canCreateService(): Promise<boolean> {
    return canPerformAction('service', 'create');
}

export async function canUpdateService(): Promise<boolean> {
    return canPerformAction('service', 'update');
}

export async function canDeleteService(): Promise<boolean> {
    return canPerformAction('service', 'delete');
}

export async function canViewService(): Promise<boolean> {
    return canPerformAction('service', 'view');
}

export async function canImportServices(): Promise<boolean> {
    return canPerformAction('service', 'create');
}

// ═══════════════════════════════════════════════════════════════
// PRODUCTS PERMISSIONS
// ═══════════════════════════════════════════════════════════════

export async function canCreateProduct(): Promise<boolean> {
    return hasPermission("create_product");
}

export async function canUpdateProduct(): Promise<boolean> {
    return hasPermission("update_product");
}

export async function canDeleteProduct(): Promise<boolean> {
    return hasPermission("delete_product");
}

export async function canViewProduct(): Promise<boolean> {
    return hasPermission("view_product");
}

// ═══════════════════════════════════════════════════════════════
// COMPLAINTS PERMISSIONS
// ═══════════════════════════════════════════════════════════════

export async function canCreateComplaint(): Promise<boolean> {
    return canPerformAction('complaint', 'create');
}

export async function canUpdateComplaint(complaintId?: string): Promise<boolean> {
    return canPerformAction('complaint', 'update', complaintId);
}

export async function canDeleteComplaint(): Promise<boolean> {
    return canPerformAction('complaint', 'delete');
}

export async function canViewComplaint(): Promise<boolean> {
    return canPerformAction('complaint', 'view');
}

// ═══════════════════════════════════════════════════════════════
// CONTRACTS PERMISSIONS
// ═══════════════════════════════════════════════════════════════

export async function canCreateContract(): Promise<boolean> {
    return canPerformAction('contract', 'create');
}

export async function canUpdateContract(): Promise<boolean> {
    return canPerformAction('contract', 'update');
}

export async function canDeleteContract(): Promise<boolean> {
    return canPerformAction('contract', 'delete');
}

export async function canViewContract(): Promise<boolean> {
    return canPerformAction('contract', 'view');
}

// ═══════════════════════════════════════════════════════════════
// PROVIDERS PERMISSIONS
// ═══════════════════════════════════════════════════════════════

export async function canCreateProvider(): Promise<boolean> {
    return canPerformAction('provider', 'create');
}

export async function canUpdateProvider(): Promise<boolean> {
    return canPerformAction('provider', 'update');
}

export async function canDeleteProvider(): Promise<boolean> {
    return canPerformAction('provider', 'delete');
}

export async function canViewProvider(): Promise<boolean> {
    return canPerformAction('provider', 'view');
}

// ═══════════════════════════════════════════════════════════════
// HUMANITARIAN ORGS PERMISSIONS
// ═══════════════════════════════════════════════════════════════

export async function canCreateHumanitarianOrg(): Promise<boolean> {
    return canPerformAction('humanitarian', 'create');
}

export async function canUpdateHumanitarianOrg(): Promise<boolean> {
    return canPerformAction('humanitarian', 'update');
}

export async function canDeleteHumanitarianOrg(): Promise<boolean> {
    return canPerformAction('humanitarian', 'delete');
}

export async function canViewHumanitarianOrg(): Promise<boolean> {
    return canPerformAction('humanitarian', 'view');
}

// ═══════════════════════════════════════════════════════════════
// USERS PERMISSIONS
// ═══════════════════════════════════════════════════════════════

export async function canCreateUser(): Promise<boolean> {
    return canPerformAction('user', 'create');
}

export async function canUpdateUser(): Promise<boolean> {
    return canPerformAction('user', 'update');
}

export async function canDeleteUser(): Promise<boolean> {
    return canPerformAction('user', 'delete');
}

export async function canViewUser(): Promise<boolean> {
    return canPerformAction('user', 'view');
}
