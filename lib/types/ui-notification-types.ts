// lib/types/ui-notification-types.ts
// This file is for UI toast/banner notifications, separate from system notifications

export type UINotificationType = "success" | "error" | "warning" | "info";

export interface UINotificationState {
  type: UINotificationType;
  title: string;
  message: string;
}

// Helper functions to create UI notifications
export const createUINotification = (
  type: UINotificationType,
  title: string,
  message: string
): UINotificationState => ({
  type,
  title,
  message,
});

// Predefined UI notification creators
export const UINotifications = {
  success: (title: string, message: string): UINotificationState =>
    createUINotification("success", title, message),
  
  error: (title: string, message: string): UINotificationState =>
    createUINotification("error", title, message),
  
  warning: (title: string, message: string): UINotificationState =>
    createUINotification("warning", title, message),
  
  info: (title: string, message: string): UINotificationState =>
    createUINotification("info", title, message),
};

// Common notification messages for reuse
export const CommonUINotifications = {
  // Success messages
  exportSuccess: () => UINotifications.success(
    "Export Successful",
    "Your data has been exported successfully."
  ),
  importSuccess: () => UINotifications.success(
    "Import Successful",
    "Your data has been imported successfully."
  ),
  saveSuccess: () => UINotifications.success(
    "Saved",
    "Your changes have been saved successfully."
  ),
  deleteSuccess: () => UINotifications.success(
    "Deleted",
    "Item has been deleted successfully."
  ),
  
  // Error messages
  exportError: () => UINotifications.error(
    "Export Failed",
    "Failed to export data. Please try again."
  ),
  importError: () => UINotifications.error(
    "Import Failed",
    "Failed to import data. Please check your file and try again."
  ),
  saveError: () => UINotifications.error(
    "Save Failed",
    "Failed to save changes. Please try again."
  ),
  deleteError: () => UINotifications.error(
    "Delete Failed",
    "Failed to delete item. Please try again."
  ),
  networkError: () => UINotifications.error(
    "Network Error",
    "Unable to connect to the server. Please check your connection."
  ),
  
  // Info messages
  processing: () => UINotifications.info(
    "Processing",
    "Your request is being processed. Please wait..."
  ),
  
  // Warning messages
  unsavedChanges: () => UINotifications.warning(
    "Unsaved Changes",
    "You have unsaved changes. Please save before leaving."
  ),
};