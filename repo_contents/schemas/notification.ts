////schemas/notification.ts


import { z } from "zod";

// Base notification schema
export const NotificationSchema = z.object({
  title: z.string().min(1).max(100),
  message: z.string().min(1),
  type: z.enum([
    "CONTRACT_EXPIRING",
    "CONTRACT_RENEWAL_STATUS_CHANGE",
    "COMPLAINT_ASSIGNED",
    "COMPLAINT_UPDATED",
    "REMINDER",
    "SYSTEM"
  ]),
  userId: z.string(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
});

// Create notification schema
export const CreateNotificationSchema = NotificationSchema.omit({ 
  userId: true 
}).extend({
  userIds: z.array(z.string()).min(1)
});

// Update notification schema (for marking as read)
export const UpdateNotificationSchema = z.object({
  id: z.string(),
  isRead: z.boolean(),
});

// Notification preferences schema
export const NotificationPreferencesSchema = z.object({
  contractExpiring: z.boolean().default(true),
  contractRenewalStatusChange: z.boolean().default(true),
  complaintAssigned: z.boolean().default(true),
  complaintUpdated: z.boolean().default(true),
  emailNotifications: z.boolean().default(true),
  inAppNotifications: z.boolean().default(true),
});

// Email notification template schema
export const EmailTemplateSchema = z.object({
  name: z.string().min(3).max(100),
  subject: z.string().min(3).max(100),
  body: z.string().min(10),
  type: z.enum([
    "CONTRACT_EXPIRING",
    "CONTRACT_RENEWAL_STATUS_CHANGE",
    "COMPLAINT_ASSIGNED",
    "COMPLAINT_UPDATED",
    "REMINDER",
    "SYSTEM"
  ]),
  isDefault: z.boolean().default(false),
});

// Push notification schema
export const PushNotificationSchema = z.object({
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(200),
  icon: z.string().optional(),
  action: z.string().optional(),
  userIds: z.array(z.string()).min(1),
});

// Bulk notification schema
export const BulkNotificationSchema = z.object({
  title: z.string().min(1).max(100),
  message: z.string().min(1),
  type: z.enum([
    "CONTRACT_EXPIRING",
    "CONTRACT_RENEWAL_STATUS_CHANGE",
    "COMPLAINT_ASSIGNED",
    "COMPLAINT_UPDATED",
    "REMINDER",
    "SYSTEM"
  ]),
  userRoles: z.array(z.enum([
    "ADMIN",
    "MANAGER",
    "AGENT",
    "USER"
  ])),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
});

// Alert threshold schema
export const AlertThresholdSchema = z.object({
  contractExpiryDays: z.number().min(1).default(30),
  complaintResponseHours: z.number().min(1).default(24),
  financialAnomaly: z.number().min(1).max(100).default(20), // Percentage
  inactiveServiceDays: z.number().min(1).default(90),
});