////schemas/security.ts


import { z } from "zod";

// Activity log schema
export const ActivityLogSchema = z.object({
  action: z.string().min(1),
  entityType: z.string().min(1),
  entityId: z.string().optional(),
  details: z.string().optional(),
  severity: z.enum(["INFO", "WARNING", "ERROR", "CRITICAL"]).default("INFO"),
  userId: z.string(),
});

// Activity log filter schema
export const ActivityLogFilterSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  action: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  userId: z.string().optional(),
  severity: z.enum(["INFO", "WARNING", "ERROR", "CRITICAL"]).optional(),
});

// Permission schema
export const PermissionSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  module: z.string(),
  action: z.enum(["CREATE", "READ", "UPDATE", "DELETE", "EXPORT", "ADMIN"]),
});

// Role based access schema
export const RolePermissionSchema = z.object({
  role: z.enum(["ADMIN", "MANAGER", "AGENT", "USER"]),
  permissions: z.array(z.string()), // Array of permission IDs
});

// Rate limit configuration schema
export const RateLimitSchema = z.object({
  path: z.string(),
  limit: z.number().min(1),
  window: z.number().min(1), // Window in seconds
  byRole: z.record(z.enum(["ADMIN", "MANAGER", "AGENT", "USER"]), z.number().min(1)).optional(),
});

// Backup configuration schema
export const BackupConfigSchema = z.object({
  enabled: z.boolean().default(true),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY"]).default("DAILY"),
  time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:MM format
  retentionDays: z.number().min(1).default(30),
  destination: z.string().min(1),
});

// Security policy schema
export const SecurityPolicySchema = z.object({
  passwordMinLength: z.number().min(8).default(12),
  passwordRequireSpecialChar: z.boolean().default(true),
  passwordRequireNumbers: z.boolean().default(true),
  passwordRequireUppercase: z.boolean().default(true),
  passwordExpiryDays: z.number().min(0).default(90), // 0 means no expiry
  loginAttemptsBeforeLockout: z.number().min(1).default(5),
  accountLockoutMinutes: z.number().min(1).default(30),
  sessionTimeoutMinutes: z.number().min(5).default(60),
  enforceMultiFactorAuth: z.boolean().default(false),
  ipWhitelist: z.array(z.string()).optional(),
});

// Security log export schema
export const SecurityLogExportSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  severity: z.enum(["INFO", "WARNING", "ERROR", "CRITICAL"]).optional(),
  format: z.enum(["CSV", "JSON", "PDF"]).default("CSV"),
  includeUserDetails: z.boolean().default(true),
});

// Performance metric schema
export const PerformanceMetricSchema = z.object({
  endpoint: z.string(),
  responseTimeMs: z.number().min(0),
  timestamp: z.coerce.date(),
  userId: z.string().optional(),
  userRole: z.enum(["ADMIN", "MANAGER", "AGENT", "USER"]).optional(),
  statusCode: z.number(),
});