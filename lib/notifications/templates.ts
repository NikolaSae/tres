// lib/notifications/templates.ts

import { NotificationType } from "@prisma/client";

/**
 * Base interface for notification template parameters
 */
export interface NotificationTemplateParams {
  [key: string]: any;
}

/**
 * Contract expiring notification parameters
 */
export interface ContractExpiringParams extends NotificationTemplateParams {
  contractName: string;
  contractNumber: string;
  daysRemaining: number;
  expiryDate: Date;
}

/**
 * Contract renewal status change parameters
 */
export interface ContractRenewalStatusChangeParams extends NotificationTemplateParams {
  contractName: string;
  contractNumber: string;
  newStatus: string;
  humanitarianOrgName?: string;
}

/**
 * Complaint assigned notification parameters
 */
export interface ComplaintAssignedParams extends NotificationTemplateParams {
  complaintId: string;
  complaintTitle: string;
  assignedAgentName: string;
}

/**
 * Complaint updated notification parameters
 */
export interface ComplaintUpdatedParams extends NotificationTemplateParams {
  complaintId: string;
  complaintTitle: string;
  newStatus: string;
  updatedBy: string;
}

/**
 * Reminder notification parameters
 */
export interface ReminderParams extends NotificationTemplateParams {
  reminderType: string;
  entityName: string;
  entityId: string;
  dueDate?: Date;
}

/**
 * System notification parameters
 */
export interface SystemParams extends NotificationTemplateParams {
  message: string;
  severity?: "info" | "warning" | "error";
}

/**
 * Get notification title template for a specific notification type
 * @param type The notification type
 * @returns A function that accepts parameters and returns a title string
 */
export function getNotificationTitleTemplate(type: NotificationType): (params: NotificationTemplateParams) => string {
  switch (type) {
    case "CONTRACT_EXPIRING":
      return (params: NotificationTemplateParams) => {
        const p = params as ContractExpiringParams;
        return `Contract ${p.contractName} Expiring in ${p.daysRemaining} Days`;
      };
    
    case "CONTRACT_RENEWAL_STATUS_CHANGE":
      return (params: NotificationTemplateParams) => {
        const p = params as ContractRenewalStatusChangeParams;
        return `Contract ${p.contractName} Renewal Status Updated`;
      };
    
    case "COMPLAINT_ASSIGNED":
      return (params: NotificationTemplateParams) => {
        const p = params as ComplaintAssignedParams;
        return `Complaint #${p.complaintId} Assigned`;
      };
    
    case "COMPLAINT_UPDATED":
      return (params: NotificationTemplateParams) => {
        const p = params as ComplaintUpdatedParams;
        return `Complaint #${p.complaintId} Status Update`;
      };
    
    case "REMINDER":
      return (params: NotificationTemplateParams) => {
        const p = params as ReminderParams;
        return `Reminder: ${p.reminderType} for ${p.entityName}`;
      };
    
    case "SYSTEM":
      return (params: NotificationTemplateParams) => {
        const p = params as SystemParams;
        return `System Notification: ${p.severity?.toUpperCase() || "INFO"}`;
      };
    
    default:
      return () => "New Notification";
  }
}

/**
 * Get notification message template for a specific notification type
 * @param type The notification type
 * @returns A function that accepts parameters and returns a message string
 */
export function getNotificationMessageTemplate(type: NotificationType): (params: NotificationTemplateParams) => string {
  switch (type) {
    case "CONTRACT_EXPIRING":
      return (params: NotificationTemplateParams) => {
        const p = params as ContractExpiringParams;
        return `The contract ${p.contractName} (${p.contractNumber}) is expiring in ${p.daysRemaining} days on ${formatDate(p.expiryDate)}. Please take appropriate action.`;
      };
    
    case "CONTRACT_RENEWAL_STATUS_CHANGE":
      return (params: NotificationTemplateParams) => {
        const p = params as ContractRenewalStatusChangeParams;
        let baseMessage = `The renewal status for contract ${p.contractName} (${p.contractNumber}) has been updated to "${p.newStatus}".`;
        
        if (p.humanitarianOrgName) {
          baseMessage += ` This affects the humanitarian organization "${p.humanitarianOrgName}".`;
        }
        
        return baseMessage;
      };
    
    case "COMPLAINT_ASSIGNED":
      return (params: NotificationTemplateParams) => {
        const p = params as ComplaintAssignedParams;
        return `Complaint "${p.complaintTitle}" (ID: ${p.complaintId}) has been assigned to ${p.assignedAgentName}. Please ensure timely processing.`;
      };
    
    case "COMPLAINT_UPDATED":
      return (params: NotificationTemplateParams) => {
        const p = params as ComplaintUpdatedParams;
        return `The status of complaint "${p.complaintTitle}" (ID: ${p.complaintId}) has been updated to "${p.newStatus}" by ${p.updatedBy}.`;
      };
    
    case "REMINDER":
      return (params: NotificationTemplateParams) => {
        const p = params as ReminderParams;
        let message = `This is a reminder regarding ${p.reminderType} for ${p.entityName}.`;
        
        if (p.dueDate) {
          message += ` Due date: ${formatDate(p.dueDate)}.`;
        }
        
        return message;
      };
    
    case "SYSTEM":
      return (params: NotificationTemplateParams) => {
        const p = params as SystemParams;
        return p.message;
      };
    
    default:
      return () => "You have a new notification.";
  }
}

/**
 * Creates a notification object with title and message
 * @param type The notification type
 * @param params Parameters for the notification template
 * @returns Object containing title and message
 */
export function createNotificationContent(
  type: NotificationType,
  params: NotificationTemplateParams
): { title: string; message: string } {
  const titleTemplate = getNotificationTitleTemplate(type);
  const messageTemplate = getNotificationMessageTemplate(type);
  
  return {
    title: titleTemplate(params),
    message: messageTemplate(params)
  };
}

/**
 * Format a date for display in notifications
 * @param date Date to format
 * @returns Formatted date string
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Helper function to create contract expiring notification
 */
export function createContractExpiringNotification(params: ContractExpiringParams) {
  return createNotificationContent("CONTRACT_EXPIRING", params);
}

/**
 * Helper function to create contract renewal status change notification
 */
export function createContractRenewalNotification(params: ContractRenewalStatusChangeParams) {
  return createNotificationContent("CONTRACT_RENEWAL_STATUS_CHANGE", params);
}

/**
 * Helper function to create complaint assigned notification
 */
export function createComplaintAssignedNotification(params: ComplaintAssignedParams) {
  return createNotificationContent("COMPLAINT_ASSIGNED", params);
}

/**
 * Helper function to create complaint updated notification
 */
export function createComplaintUpdatedNotification(params: ComplaintUpdatedParams) {
  return createNotificationContent("COMPLAINT_UPDATED", params);
}

/**
 * Helper function to create reminder notification
 */
export function createReminderNotification(params: ReminderParams) {
  return createNotificationContent("REMINDER", params);
}

/**
 * Helper function to create system notification
 */
export function createSystemNotification(params: SystemParams) {
  return createNotificationContent("SYSTEM", params);
}

export function getEmailTemplate(templateName: string, templateData: Record<string, any>): string {
  const title = templateData.title || "Notification";
  const message = templateData.message || "You have a new notification.";
  const actionUrl = templateData.actionUrl || process.env.NEXT_PUBLIC_APP_URL || "#";

  return `
    <div style="font-family: Arial, sans-serif; line-height:1.5;">
      <h2>${title}</h2>
      <p>${message}</p>
      <p>Template: ${templateName}</p>
      <p><a href="${actionUrl}">Open application</a></p>
    </div>
  `;
}