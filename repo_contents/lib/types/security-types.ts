////lib/types/security-types.ts


import { UserRole } from "@prisma/client";

// Activity log severity levels
export type LogSeverity = "INFO" | "WARNING" | "ERROR" | "CRITICAL";

// Activity log interface
export interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: string;
  severity: LogSeverity;
  userId: string;
  createdAt: Date;
}

// Activity log filter options
export interface ActivityLogFilter {
  startDate?: Date;
  endDate?: Date;
  action?: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  severity?: LogSeverity;
}

// Permission action types
export type PermissionAction = "CREATE" | "READ" | "UPDATE" | "DELETE" | "EXPORT" | "ADMIN";

// Permission interface
export interface Permission {
  id: string;
  name: string;
  description?: string;
  module: string;
  action: PermissionAction;
}

// Role permissions mapping
export interface RolePermissions {
  role: UserRole;
  permissions: string[]; // Array of permission IDs
}

// Rate limit configuration
export interface RateLimitConfig {
  path: string;
  limit: number;
  window: number; // Window in seconds
  byRole?: Partial<Record<UserRole, number>>;
}

// Backup configuration
export interface BackupConfig {
  enabled: boolean;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY";
  time: string; // HH:MM format
  retentionDays: number;
  destination: string;
}

// Security policy configuration
export interface SecurityPolicy {
  passwordMinLength: number;
  passwordRequireSpecialChar: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireUppercase: boolean;
  passwordExpiryDays: number;
  loginAttemptsBeforeLockout: number;
  accountLockoutMinutes: number;
  sessionTimeoutMinutes: number;
  enforceMultiFactorAuth: boolean;
  ipWhitelist?: string[];
}

// Security log export options
export interface SecurityLogExportOptions {
  startDate: Date;
  endDate: Date;
  severity?: LogSeverity;
  format: "CSV" | "JSON" | "PDF";
  includeUserDetails: boolean;
}

// Performance metric
export interface PerformanceMetric {
  endpoint: string;
  responseTimeMs: number;
  timestamp: Date;
  userId?: string;
  userRole?: UserRole;
  statusCode: number;
}

// Authentication attempt
export interface AuthAttempt {
  id: string;
  email: string;
  success: boolean;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

// RBAC (Role-Based Access Control) context
export interface RbacContext {
  userId: string;
  userRole: UserRole;
  permissions: Permission[];
  canAccess: (module: string, action: PermissionAction) => boolean;
}

// Resource access policy
export interface ResourceAccessPolicy {
  resource: string;
  allowedRoles: UserRole[];
  conditions?: {
    ownResource?: boolean;
    customCheck?: (userId: string, resourceId: string) => Promise<boolean>;
  };
}

// User session information
export interface SessionInfo {
  userId: string;
  role: UserRole;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  expiresAt: Date;
  lastActive: Date;
}

// API key for service integrations
export interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: Permission[];
  createdBy: string;
  createdAt: Date;
  expiresAt?: Date;
  lastUsed?: Date;
}