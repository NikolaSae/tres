// /lib/security/permission-checker.ts
import { db } from "@/lib/db";
import { getCurrentUser } from "./auth-helpers";
import { UserRole } from "@prisma/client";

type EntityType = "contract" | "complaint" | "service" | "provider" |
                 "humanitarian" | "report" | "user" | "analytics"; // Added 'analytics' if needed for analytics view permissions

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
        analytics: ["view"], // Assume Admins can view analytics
    },
    MANAGER: {
        contract: ["view", "create", "update"],
        complaint: ["view", "create", "update"],
        service: ["view", "create", "update"],
        provider: ["view", "create", "update"],
        humanitarian: ["view", "create", "update"],
        report: ["view", "create", "update"],
        user: ["view"],
        analytics: ["view"], // Assume Managers can view analytics
    },
    AGENT: {
        contract: ["view"],
        complaint: ["view", "create", "update"],
        service: ["view"],
        provider: ["view"],
        humanitarian: ["view"],
        report: ["view"],
        user: ["view"],
        analytics: [], // Assume Agents cannot view general analytics, adjust if needed
    },
    USER: {
        contract: [],
        complaint: ["view", "create"],
        service: ["view"],
        provider: ["view"],
        humanitarian: ["view"],
        report: [],
        user: [],
        analytics: [], // Assume regular Users cannot view analytics
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
    // Check if the entityType exists in the map for the user's role
    if (!rolePermissionMap[userRole] || !rolePermissionMap[userRole][entityType]) {
         return false; // Role or EntityType not configured in map
    }

    const allowedActions = rolePermissionMap[userRole][entityType] || [];

    if (!allowedActions.includes(action)) {
        return false;
    }

    // Additional entity-specific checks can be added here
    // For example, check if a user can only update complaints they submitted
    if (entityId && entityType === "complaint" && action === "update" && userRole === UserRole.USER) {
        const complaint = await db.complaint.findUnique({
            where: { id: entityId }
        });

        return complaint?.submittedById === user.id;
    }

    return true;
}

// Add and export helper functions for specific view permissions
export const canViewComplaintData = async (): Promise<boolean> => {
    return canPerformAction('analytics', 'view'); // Assuming analytics 'view' covers data views
    // OR if you want separate permissions per data type:
    // return canPerformAction('complaint', 'view'); // If permission is tied to complaint entity
};

export const canViewFinancialData = async (): Promise<boolean> => {
     return canPerformAction('analytics', 'view'); // Assuming analytics 'view' covers data views
     // OR if you want separate permissions per data type:
     // return canPerformAction('report', 'view'); // If permission is tied to report entity
};

export const canViewSalesData = async (): Promise<boolean> => {
     return canPerformAction('analytics', 'view'); // Assuming analytics 'view' covers data views
     // OR if you want separate permissions per data type:
     // return canPerformAction('service', 'view'); // If permission is tied to service entity
};

// You might also need a general check for accessing the analytics page itself
export const canAccessAnalyticsPage = async (): Promise<boolean> => {
     const user = await getCurrentUser();
     if (!user || !user.role) return false;
     const userRole = user.role as UserRole;
      // Check if the user's role is configured to view 'analytics'
     return rolePermissionMap[userRole]?.['analytics']?.includes('view') || false;
};