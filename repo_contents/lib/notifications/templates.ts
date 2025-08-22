////lib/notifications/templates.ts


import { NotificationType } from "@prisma/client";

/**
 * Interface for notification template parameters
 * Different notification types require different parameters
 */
export interface NotificationTemplateParams {
  [key: string]: any;
}

/**
 * Contract expiring notification parameters
 */
export interface ContractExpiringParams {
  contractName: string;
  contractNumber: string;
  daysRemaining: number;
  expiryDate: Date;
}

/**
 * Contract renewal status change parameters
 */
export interface ContractRenewalStatusChangeParams {
  contractName: string;
  contractNumber: string;
  newStatus: string;
  humanitarianOrgName?: string;
}

/**
 * Complaint assigned notification parameters
 */
export interface ComplaintAssignedParams {
  complaintId: string;
  complaintTitle: string;
  assignedAgentName: string;
}

/**
 * Complaint updated notification parameters
 */
export interface ComplaintUpdatedParams {
  complaintId: string;
  complaintTitle: string;
  newStatus: string;
  updatedBy: string;
}

/**
 * Reminder notification parameters
 */
export interface ReminderParams {
  reminderType: string;
  entityName: string;
  entityId: string;
  dueDate?: Date;
}

/**
 * System notification parameters
 */
export interface SystemParams {
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
      return (params: ContractExpiringParams) => 
        `Contract ${params.contractName} Expiring in ${params.daysRemaining} Days`;
    
    case "CONTRACT_RENEWAL_STATUS_CHANGE":
      return (params: ContractRenewalStatusChangeParams) => 
        `Contract ${params.contractName} Renewal Status Updated`;
    
    case "COMPLAINT_ASSIGNED":
      return (params: ComplaintAssignedParams) => 
        `Complaint #${params.complaintId} Assigned`;
    
    case "COMPLAINT_UPDATED":
      return (params: ComplaintUpdatedParams) => 
        `Complaint #${params.complaintId} Status Update`;
    
    case "REMINDER":
      return (params: ReminderParams) => 
        `Reminder: ${params.reminderType} for ${params.entityName}`;
    
    case "SYSTEM":
      return (params: SystemParams) => 
        `System Notification: ${params.severity?.toUpperCase() || "INFO"}`;
    
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
      return (params: ContractExpiringParams) => 
        `The contract ${params.contractName} (${params.contractNumber}) is expiring in ${params.daysRemaining} days on ${formatDate(params.expiryDate)}. Please take appropriate action.`;
    
    case "CONTRACT_RENEWAL_STATUS_CHANGE":
      return (params: ContractRenewalStatusChangeParams) => {
        let baseMessage = `The renewal status for contract ${params.contractName} (${params.contractNumber}) has been updated to "${params.newStatus}".`;
        
        if (params.humanitarianOrgName) {
          baseMessage += ` This affects the humanitarian organization "${params.humanitarianOrgName}".`;
        }
        
        return baseMessage;
      };
    
    case "COMPLAINT_ASSIGNED":
      return (params: ComplaintAssignedParams) => 
        `Complaint "${params.complaintTitle}" (ID: ${params.complaintId}) has been assigned to ${params.assignedAgentName}. Please ensure timely processing.`;
    
    case "COMPLAINT_UPDATED":
      return (params: ComplaintUpdatedParams) => 
        `The status of complaint "${params.complaintTitle}" (ID: ${params.complaintId}) has been updated to "${params.newStatus}" by ${params.updatedBy}.`;
    
    case "REMINDER":
      return (params: ReminderParams) => {
        let message = `This is a reminder regarding ${params.reminderType} for ${params.entityName}.`;
        
        if (params.dueDate) {
          message += ` Due date: ${formatDate(params.dueDate)}.`;
        }
        
        return message;
      };
    
    case "SYSTEM":
      return (params: SystemParams) => params.message;
    
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