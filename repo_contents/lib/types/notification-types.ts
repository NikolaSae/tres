// Path: lib/types/notification-types.ts

// Notification types
export type NotificationType =
  | "CONTRACT_EXPIRING"
  | "CONTRACT_RENEWAL_STATUS_CHANGE"
  | "COMPLAINT_ASSIGNED"
  | "COMPLAINT_UPDATED"
  | "REMINDER"
  | "SYSTEM";

// Base notification interface
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  userId: string;
  entityType?: string;
  entityId?: string;
  createdAt: Date;
}

// Contract expiring notification specifics
export interface ContractExpiryNotification extends Notification {
  type: "CONTRACT_EXPIRING";
  entityType: "contract";
  daysRemaining: number;
}

// Contract renewal status notification specifics
export interface ContractRenewalNotification extends Notification {
  type: "CONTRACT_RENEWAL_STATUS_CHANGE";
  entityType: "renewal";
  previousStatus: string;
  newStatus: string;
}

// Complaint notification specifics
export interface ComplaintNotification extends Notification {
  type: "COMPLAINT_ASSIGNED" | "COMPLAINT_UPDATED";
  entityType: "complaint";
  complaintTitle: string;
}

// Reminder notification specifics
export interface ReminderNotification extends Notification {
  type: "REMINDER";
  entityType: string;
  dueDate?: Date;
}

// Notification creation payloads
export interface CreateNotificationPayload {
  title: string;
  message: string;
  type: NotificationType;
  userIds: string[];
  entityType?: string;
  entityId?: string;
}

// Email notification template
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: NotificationType;
  isDefault: boolean;
}

// Push notification payload
export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  action?: string;
  userIds: string[];
}

// KORIGOVANO: Updated User notification preferences interface
// Each notification type preference now has nested inApp and email booleans
export interface NotificationPreferences {
  userId: string;
  // Specific notification type preferences
  contractExpiring: { inApp: boolean; email: boolean };
  contractRenewalStatusChange: { inApp: boolean; email: boolean };
  complaintAssigned: { inApp: boolean; email: boolean };
  complaintUpdated: { inApp: boolean; email: boolean };
  reminder: { inApp: boolean; email: boolean }; // Assuming REMINDER also has these options
  system: { inApp: boolean; email: boolean }; // Assuming SYSTEM also has these options

  // General preferences (if still needed, adjust based on your logic)
   // If the specific types control email/in-app, these might be redundant
  emailNotifications: boolean;
  inAppNotifications: boolean;
}

// Notification batch processing
export interface NotificationBatch {
  notifications: CreateNotificationPayload[];
  sendEmail: boolean;
  sendPush: boolean;
}

// User notification summary
export interface UserNotificationSummary {
  userId: string;
  username: string;
  totalNotifications: number;
  unreadNotifications: number;
  latestNotification?: Notification;
}

// Alert threshold configuration
export interface AlertThresholds {
  contractExpiryDays: number;
  complaintResponseHours: number;
  financialAnomaly: number; // Percentage
  inactiveServiceDays: number;
}

// Notification delivery status
export interface NotificationDeliveryStatus {
  notificationId: string;
  inApp: boolean;
  email?: {
    sent: boolean;
    error?: string;
    sentAt?: Date;
  };
  push?: {
    sent: boolean;
    error?: string;
    sentAt?: Date;
   };
}

// Notification center stats
export interface NotificationCenterStats {
  totalNotifications: number;
  unreadNotifications: number;
  byType: Record<NotificationType, number>;
  recent: Notification[];
}
