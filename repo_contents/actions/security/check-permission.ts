///actions/security/check-permission.ts
"use server";

import { auth } from "@/lib/auth";
import { UserRole, LogSeverity } from "@prisma/client";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/security/audit-logger";

export interface Permission {
  name: string;
  resource: string;
  action: string;
  roles: UserRole[];
}

// Define system permissions
const PERMISSIONS: Permission[] = [
  // Analytics permissions
  { name: "view_analytics", resource: "analytics", action: "view", roles: [UserRole.ADMIN, UserRole.MANAGER] },
  { name: "view_financial_analytics", resource: "analytics", action: "view_financial", roles: [UserRole.ADMIN, UserRole.MANAGER] },
  { name: "view_sales_analytics", resource: "analytics", action: "view_sales", roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT] },
  { name: "view_complaint_analytics", resource: "analytics", action: "view_complaints", roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT] },
  { name: "view_provider_analytics", resource: "analytics", action: "view_providers", roles: [UserRole.ADMIN, UserRole.MANAGER] },
  
  // Report permissions
  { name: "generate_reports", resource: "reports", action: "generate", roles: [UserRole.ADMIN, UserRole.MANAGER] },
  { name: "schedule_reports", resource: "reports", action: "schedule", roles: [UserRole.ADMIN, UserRole.MANAGER] },
  { name: "view_reports", resource: "reports", action: "view", roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT] },
  
  // Service permissions
  { name: "create_service", resource: "services", action: "create", roles: [UserRole.ADMIN, UserRole.MANAGER] },
  { name: "update_service", resource: "services", action: "update", roles: [UserRole.ADMIN, UserRole.MANAGER] },
  { name: "delete_service", resource: "services", action: "delete", roles: [UserRole.ADMIN] },
  { name: "view_service", resource: "services", action: "view", roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT, UserRole.USER] },
  { name: "import_services", resource: "services", action: "import", roles: [UserRole.ADMIN, UserRole.MANAGER] },
  
  // Product permissions
  { name: "create_product", resource: "products", action: "create", roles: [UserRole.ADMIN, UserRole.MANAGER] },
  { name: "update_product", resource: "products", action: "update", roles: [UserRole.ADMIN, UserRole.MANAGER] },
  { name: "delete_product", resource: "products", action: "delete", roles: [UserRole.ADMIN] },
  { name: "view_product", resource: "products", action: "view", roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT, UserRole.USER] },
  
  // Complaint permissions
  { name: "create_complaint", resource: "complaints", action: "create", roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT, UserRole.USER] },
  { name: "update_complaint", resource: "complaints", action: "update", roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT] },
  { name: "assign_complaint", resource: "complaints", action: "assign", roles: [UserRole.ADMIN, UserRole.MANAGER] },
  { name: "resolve_complaint", resource: "complaints", action: "resolve", roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT] },
  { name: "delete_complaint", resource: "complaints", action: "delete", roles: [UserRole.ADMIN] },
  { name: "view_complaint", resource: "complaints", action: "view", roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT, UserRole.USER] },
  { name: "view_all_complaints", resource: "complaints", action: "view_all", roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT] },
  { name: "add_internal_comment", resource: "complaints", action: "add_internal_comment", roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT] },
  
  // Contract permissions
  { name: "create_contract", resource: "contracts", action: "create", roles: [UserRole.ADMIN, UserRole.MANAGER] },
  { name: "update_contract", resource: "contracts", action: "update", roles: [UserRole.ADMIN, UserRole.MANAGER] },
  { name: "delete_contract", resource: "contracts", action: "delete", roles: [UserRole.ADMIN] },
  { name: "view_contract", resource: "contracts", action: "view", roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT] },
  { name: "add_contract_attachment", resource: "contracts", action: "add_attachment", roles: [UserRole.ADMIN, UserRole.MANAGER] },
  { name: "manage_contract_renewal", resource: "contracts", action: "manage_renewal", roles: [UserRole.ADMIN, UserRole.MANAGER] },
  
  // Provider permissions
  { name: "create_provider", resource: "providers", action: "create", roles: [UserRole.ADMIN, UserRole.MANAGER] },
  { name: "update_provider", resource: "providers", action: "update", roles: [UserRole.ADMIN, UserRole.MANAGER] },
  { name: "delete_provider", resource: "providers", action: "delete", roles: [UserRole.ADMIN] },
  { name: "view_provider", resource: "providers", action: "view", roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT] },
  
  // Humanitarian organization permissions
  { name: "create_humanitarian_org", resource: "humanitarian_orgs", action: "create", roles: [UserRole.ADMIN, UserRole.MANAGER] },
  { name: "update_humanitarian_org", resource: "humanitarian_orgs", action: "update", roles: [UserRole.ADMIN, UserRole.MANAGER] },
  { name: "delete_humanitarian_org", resource: "humanitarian_orgs", action: "delete", roles: [UserRole.ADMIN] },
  { name: "view_humanitarian_org", resource: "humanitarian_orgs", action: "view", roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT] },
  
  // Notification permissions
  { name: "manage_notification_settings", resource: "notifications", action: "manage_settings", roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT, UserRole.USER] },
  { name: "send_system_notification", resource: "notifications", action: "send_system", roles: [UserRole.ADMIN] },
  
  // User management permissions
  { name: "create_user", resource: "users", action: "create", roles: [UserRole.ADMIN] },
  { name: "update_user", resource: "users", action: "update", roles: [UserRole.ADMIN] },
  { name: "delete_user", resource: "users", action: "delete", roles: [UserRole.ADMIN] },
  { name: "view_user", resource: "users", action: "view", roles: [UserRole.ADMIN, UserRole.MANAGER] },
  { name: "change_user_role", resource: "users", action: "change_role", roles: [UserRole.ADMIN] },
  
  // Security permissions
  { name: "view_security_logs", resource: "security", action: "view_logs", roles: [UserRole.ADMIN] },
  { name: "manage_permissions", resource: "security", action: "manage_permissions", roles: [UserRole.ADMIN] },
];

/**
 * Check if a user has a specific permission
 * @param permissionName The name of the permission to check
 * @param userId Optional user ID (defaults to current authenticated user)
 * @returns Boolean indicating if the user has the permission
 */
export async function checkPermission(
  permissionName: string,
  userId?: string
): Promise<boolean> {
  try {
    // Get the current session if userId is not provided
    let user;
    
    if (userId) {
      // Get user by ID from database
      user = await db.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, isActive: true }
      });
    } else {
      // Get current user from session
      const session = await auth();
      
      if (!session?.user) {
        return false;
      }
      
      user = {
        id: session.user.id,
        role: session.user.role,
        isActive: session.user.isActive ?? true
      };
    }
    
    // User not found or inactive
    if (!user || !user.isActive) {
      return false;
    }
    
    // Find the permission
    const permission = PERMISSIONS.find(p => p.name === permissionName);
    
    // Permission not defined
    if (!permission) {
      await logActivity("permission_check_failed", {
        entityType: "permission",
        entityId: permissionName,
        details: `Permission "${permissionName}" does not exist in the system`,
        severity: LogSeverity.WARNING,
        userId: user.id
      });
      return false;
    }
    
    // Check if the user's role is included in the permission's allowed roles
    const hasPermission = permission.roles.includes(user.role as UserRole);
    
    // Log access attempts for sensitive permissions
    const sensitivePermissions = [
      "delete_contract", 
      "delete_provider", 
      "manage_permissions", 
      "change_user_role", 
      "delete_user",
      "view_financial_analytics"
    ];
    
    if (sensitivePermissions.includes(permissionName)) {
      await logActivity(hasPermission ? "permission_granted" : "permission_denied", {
        entityType: "permission",
        entityId: permissionName,
        details: `User ${hasPermission ? "has" : "does not have"} permission "${permissionName}"`,
        severity: hasPermission ? LogSeverity.INFO : LogSeverity.WARNING,
        userId: user.id
      });
    }
    
    return hasPermission;
  } catch (error) {
    console.error("Error checking permission:", error);
    return false;
  }
}

/**
 * Get all permissions for a specific role
 * @param role User role
 * @returns Array of permission names available to the role
 */
export function getPermissionsForRole(role: UserRole): string[] {
  return PERMISSIONS
    .filter(permission => permission.roles.includes(role))
    .map(permission => permission.name);
}

/**
 * Get all permissions grouped by resource
 * @returns Object with resources as keys and arrays of permissions as values
 */
export function getAllPermissionsByResource(): Record<string, Permission[]> {
  const result: Record<string, Permission[]> = {};
  
  for (const permission of PERMISSIONS) {
    if (!result[permission.resource]) {
  result[permission.resource] = [];
}
result[permission.resource].push(permission);
  }
  
  return result;
}

/**
 * Check if current user has specific permissions and throw error if not
 * @param permissionName The name of the permission to check
 * @throws Error if user doesn't have permission
 */
export async function requirePermission(permissionName: string): Promise<void> {
  const hasPermission = await checkPermission(permissionName);
  
  if (!hasPermission) {
    throw new Error(`You don't have permission to perform this action`);
  }
}
