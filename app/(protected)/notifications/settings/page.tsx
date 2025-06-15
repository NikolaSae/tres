// Path: app/(protected)/notifications/settings/page.tsx
import { Metadata } from 'next';
import { getCurrentUser } from '@/lib/security/auth-helpers';
import NotificationSettings from '@/components/notifications/NotificationSettings'; // Import the settings component
import { NotificationPreferences } from '@/lib/types/notification-types'; // Import the updated type
import { getUserNotificationPreferences } from '@/actions/notifications/get-preferences'; // !!! YOU NEED TO IMPLEMENT THIS ACTION !!!


export const metadata: Metadata = {
  title: 'Notification Settings | Service Management',
  description: 'Manage your notification preferences',
};

// Define a default set of preferences matching the updated interface
const defaultNotificationPreferences: NotificationPreferences = {
    userId: '', // This will be set by the action or backend
    contractExpiring: { inApp: true, email: false },
    contractRenewalStatusChange: { inApp: true, email: false },
    complaintAssigned: { inApp: true, email: false },
    complaintUpdated: { inApp: true, email: false },
    reminder: { inApp: true, email: false },
    system: { inApp: true, email: false },
    emailNotifications: true, // Default general email preference
    inAppNotifications: true, // Default general in-app preference
};


// This is a Server Component to fetch data
export default async function NotificationSettingsPage() {
  // Get the current user on the server
  const user = await getCurrentUser();

  if (!user) {
    // Handle unauthorized access
    return <div>Unauthorized</div>;
  }

  // Fetch user notification preferences using a server action
  // !!! Ensure getUserNotificationPreferences handles the case where preferences don't exist
  // and returns a default object like defaultNotificationPreferences !!!
  const preferencesResult = await getUserNotificationPreferences(user.id);

  let userPreferences: NotificationPreferences;

  if (preferencesResult && 'error' in preferencesResult) {
      console.error("Failed to fetch notification preferences:", preferencesResult.error);
      // Fallback to default preferences on error
      userPreferences = { ...defaultNotificationPreferences, userId: user.id };
      // You might want to show a user-facing error message as well
  } else {
      // Use fetched preferences or the default if fetch returned null/undefined
      // Ensure the fetched preferences object is merged with defaults to cover all keys
      userPreferences = {
          ...defaultNotificationPreferences,
          ...preferencesResult, // This might be null/undefined if not found
          userId: user.id // Always set the correct user ID
      };

      // If the fetched preferences object is missing nested keys (e.g., contractExpiring),
      // the merge above might not be enough. A more robust approach ensures all nested
      // objects exist, potentially merging recursively or checking for each key.
      // For simplicity here, we assume the backend returns the basic structure,
      // and the default covers missing nested objects.
      // A safer merge might look like:
      userPreferences = {
          ...defaultNotificationPreferences,
          ...preferencesResult,
          userId: user.id,
          contractExpiring: { ...defaultNotificationPreferences.contractExpiring, ...preferencesResult?.contractExpiring },
          contractRenewalStatusChange: { ...defaultNotificationPreferences.contractRenewalStatusChange, ...preferencesResult?.contractRenewalStatusChange },
          complaintAssigned: { ...defaultNotificationPreferences.complaintAssigned, ...preferencesResult?.complaintAssigned },
          complaintUpdated: { ...defaultNotificationPreferences.complaintUpdated, ...preferencesResult?.complaintUpdated },
          reminder: { ...defaultNotificationPreferences.reminder, ...preferencesResult?.reminder },
          system: { ...defaultNotificationPreferences.system, ...preferencesResult?.system },
      };
  }


  return (
    <div className="container mx-auto py-8">
      {/* Pass the fetched or default preferences to the Client Component */}
      {/* NotificationSettings is a Client Component, rendered here on the server */}
      <NotificationSettings initialPreferences={userPreferences} />
    </div>
  );
}


