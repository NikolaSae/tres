// lib/security/permissions.ts

import { UserRole } from "@prisma/client";

export interface Permission {
  name: string;
  resource: string;
  action: string;
  roles: UserRole[];
}

/**
 * Central definition of all system permissions
 * This file MUST NOT contain any server-only logic
 */
export const PERMISSIONS: Permission[] = [
  // ───────────────── Analytics ─────────────────
  {
    name: "view_analytics",
    resource: "analytics",
    action: "view",
    roles: [UserRole.ADMIN, UserRole.MANAGER],
  },
  {
    name: "view_financial_analytics",
    resource: "analytics",
    action: "view_financial",
    roles: [UserRole.ADMIN, UserRole.MANAGER],
  },
  {
    name: "view_sales_analytics",
    resource: "analytics",
    action: "view_sales",
    roles: [
      UserRole.ADMIN,
      UserRole.MANAGER,
      UserRole.AGENT,
    ],
  },
  {
    name: "view_complaint_analytics",
    resource: "analytics",
    action: "view_complaints",
    roles: [
      UserRole.ADMIN,
      UserRole.MANAGER,
      UserRole.AGENT,
    ],
  },
  {
    name: "view_provider_analytics",
    resource: "analytics",
    action: "view_providers",
    roles: [UserRole.ADMIN, UserRole.MANAGER],
  },

  // ───────────────── Reports ─────────────────
  {
    name: "generate_reports",
    resource: "reports",
    action: "generate",
    roles: [UserRole.ADMIN, UserRole.MANAGER],
  },
  {
    name: "schedule_reports",
    resource: "reports",
    action: "schedule",
    roles: [UserRole.ADMIN, UserRole.MANAGER],
  },
  {
    name: "view_reports",
    resource: "reports",
    action: "view",
    roles: [
      UserRole.ADMIN,
      UserRole.MANAGER,
      UserRole.AGENT,
    ],
  },

  // ───────────────── Services ─────────────────
  {
    name: "create_service",
    resource: "services",
    action: "create",
    roles: [UserRole.ADMIN, UserRole.MANAGER],
  },
  {
    name: "update_service",
    resource: "services",
    action: "update",
    roles: [UserRole.ADMIN, UserRole.MANAGER],
  },
  {
    name: "delete_service",
    resource: "services",
    action: "delete",
    roles: [UserRole.ADMIN],
  },
  {
    name: "view_service",
    resource: "services",
    action: "view",
    roles: [
      UserRole.ADMIN,
      UserRole.MANAGER,
      UserRole.AGENT,
      UserRole.USER,
    ],
  },
  {
    name: "import_services",
    resource: "services",
    action: "import",
    roles: [UserRole.ADMIN, UserRole.MANAGER],
  },

  // ───────────────── Products ─────────────────
  {
    name: "create_product",
    resource: "products",
    action: "create",
    roles: [UserRole.ADMIN, UserRole.MANAGER],
  },
  {
    name: "update_product",
    resource: "products",
    action: "update",
    roles: [UserRole.ADMIN, UserRole.MANAGER],
  },
  {
    name: "delete_product",
    resource: "products",
    action: "delete",
    roles: [UserRole.ADMIN],
  },
  {
    name: "view_product",
    resource: "products",
    action: "view",
    roles: [
      UserRole.ADMIN,
      UserRole.MANAGER,
      UserRole.AGENT,
      UserRole.USER,
    ],
  },

  // ───────────────── Complaints ─────────────────
  {
    name: "create_complaint",
    resource: "complaints",
    action: "create",
    roles: [
      UserRole.ADMIN,
      UserRole.MANAGER,
      UserRole.AGENT,
      UserRole.USER,
    ],
  },
  {
    name: "update_complaint",
    resource: "complaints",
    action: "update",
    roles: [
      UserRole.ADMIN,
      UserRole.MANAGER,
      UserRole.AGENT,
    ],
  },
  {
    name: "assign_complaint",
    resource: "complaints",
    action: "assign",
    roles: [UserRole.ADMIN, UserRole.MANAGER],
  },
  {
    name: "resolve_complaint",
    resource: "complaints",
    action: "resolve",
    roles: [
      UserRole.ADMIN,
      UserRole.MANAGER,
      UserRole.AGENT,
    ],
  },
  {
    name: "delete_complaint",
    resource: "complaints",
    action: "delete",
    roles: [UserRole.ADMIN],
  },
  {
    name: "view_complaint",
    resource: "complaints",
    action: "view",
    roles: [
      UserRole.ADMIN,
      UserRole.MANAGER,
      UserRole.AGENT,
      UserRole.USER,
    ],
  },
  {
    name: "view_all_complaints",
    resource: "complaints",
    action: "view_all",
    roles: [
      UserRole.ADMIN,
      UserRole.MANAGER,
      UserRole.AGENT,
    ],
  },
  {
    name: "add_internal_comment",
    resource: "complaints",
    action: "add_internal_comment",
    roles: [
      UserRole.ADMIN,
      UserRole.MANAGER,
      UserRole.AGENT,
    ],
  },

  // ───────────────── Contracts ─────────────────
  {
    name: "create_contract",
    resource: "contracts",
    action: "create",
    roles: [UserRole.ADMIN, UserRole.MANAGER],
  },
  {
    name: "update_contract",
    resource: "contracts",
    action: "update",
    roles: [UserRole.ADMIN, UserRole.MANAGER],
  },
  {
    name: "delete_contract",
    resource: "contracts",
    action: "delete",
    roles: [UserRole.ADMIN],
  },
  {
    name: "view_contract",
    resource: "contracts",
    action: "view",
    roles: [
      UserRole.ADMIN,
      UserRole.MANAGER,
      UserRole.AGENT,
    ],
  },
  {
    name: "add_contract_attachment",
    resource: "contracts",
    action: "add_attachment",
    roles: [UserRole.ADMIN, UserRole.MANAGER],
  },
  {
    name: "manage_contract_renewal",
    resource: "contracts",
    action: "manage_renewal",
    roles: [UserRole.ADMIN, UserRole.MANAGER],
  },

  // ───────────────── Providers ─────────────────
  {
    name: "create_provider",
    resource: "providers",
    action: "create",
    roles: [UserRole.ADMIN, UserRole.MANAGER],
  },
  {
    name: "update_provider",
    resource: "providers",
    action: "update",
    roles: [UserRole.ADMIN, UserRole.MANAGER],
  },
  {
    name: "delete_provider",
    resource: "providers",
    action: "delete",
    roles: [UserRole.ADMIN],
  },
  {
    name: "view_provider",
    resource: "providers",
    action: "view",
    roles: [
      UserRole.ADMIN,
      UserRole.MANAGER,
      UserRole.AGENT,
    ],
  },

  // ───────────────── Humanitarian Orgs ─────────────────
  {
    name: "create_humanitarian_org",
    resource: "humanitarian_orgs",
    action: "create",
    roles: [UserRole.ADMIN, UserRole.MANAGER],
  },
  {
    name: "update_humanitarian_org",
    resource: "humanitarian_orgs",
    action: "update",
    roles: [UserRole.ADMIN, UserRole.MANAGER],
  },
  {
    name: "delete_humanitarian_org",
    resource: "humanitarian_orgs",
    action: "delete",
    roles: [UserRole.ADMIN],
  },
  {
    name: "view_humanitarian_org",
    resource: "humanitarian_orgs",
    action: "view",
    roles: [
      UserRole.ADMIN,
      UserRole.MANAGER,
      UserRole.AGENT,
    ],
  },

  // ───────────────── Notifications ─────────────────
  {
    name: "manage_notification_settings",
    resource: "notifications",
    action: "manage_settings",
    roles: [
      UserRole.ADMIN,
      UserRole.MANAGER,
      UserRole.AGENT,
      UserRole.USER,
    ],
  },
  {
    name: "send_system_notification",
    resource: "notifications",
    action: "send_system",
    roles: [UserRole.ADMIN],
  },

  // ───────────────── Users ─────────────────
  {
    name: "create_user",
    resource: "users",
    action: "create",
    roles: [UserRole.ADMIN],
  },
  {
    name: "update_user",
    resource: "users",
    action: "update",
    roles: [UserRole.ADMIN],
  },
  {
    name: "delete_user",
    resource: "users",
    action: "delete",
    roles: [UserRole.ADMIN],
  },
  {
    name: "view_user",
    resource: "users",
    action: "view",
    roles: [UserRole.ADMIN, UserRole.MANAGER],
  },
  {
    name: "change_user_role",
    resource: "users",
    action: "change_role",
    roles: [UserRole.ADMIN],
  },

  // ───────────────── Security ─────────────────
  {
    name: "view_security_logs",
    resource: "security",
    action: "view_logs",
    roles: [UserRole.ADMIN],
  },
  {
    name: "manage_permissions",
    resource: "security",
    action: "manage_permissions",
    roles: [UserRole.ADMIN],
  },
];

/**
 * Get all permission names for a role
 */
export function getPermissionsForRole(
  role: UserRole
): string[] {
  return PERMISSIONS
    .filter((p) => p.roles.includes(role))
    .map((p) => p.name);
}

/**
 * Group permissions by resource
 */
export function getAllPermissionsByResource(): Record<
  string,
  Permission[]
> {
  const result: Record<string, Permission[]> = {};

  for (const permission of PERMISSIONS) {
    if (!result[permission.resource]) {
      result[permission.resource] = [];
    }
    result[permission.resource].push(permission);
  }

  return result;
}
