// Path: app/(protected)/notifications/settings/page.tsx
import { Metadata } from 'next';
import { getCurrentUser } from '@/lib/security/auth-helpers';
import NotificationSettings from '@/components/notifications/NotificationSettings';
import { NotificationPreferences } from '@/lib/types/notification-types';
import { getUserNotificationPreferences } from '@/actions/notifications/get-preferences';
import { redirect } from 'next/navigation'; // ✅ Dodaj import

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
    emailNotifications: true,
    inAppNotifications: true,
};

// This is a Server Component to fetch data
export default async function NotificationSettingsPage() {
  // Get the current user on the server
  const user = await getCurrentUser();

  // ✅ Proveri da li user postoji i da li ima ID
  if (!user || !user.id) {
    // Redirect to login or show unauthorized page
    redirect('/auth/login');
  }

  // ✅ Sada TypeScript zna da user.id postoji (type guard)
  const userId = user.id;

  // Fetch user notification preferences using a server action
  const preferencesResult = await getUserNotificationPreferences(userId);

  let userPreferences: NotificationPreferences;

  if (preferencesResult && 'error' in preferencesResult) {
      console.error("Failed to fetch notification preferences:", preferencesResult.error);
      // Fallback to default preferences on error
      userPreferences = { ...defaultNotificationPreferences, userId };
  } else {
      // Use fetched preferences or the default if fetch returned null/undefined
      // Deep merge with defaults to ensure all nested keys exist
      userPreferences = {
          ...defaultNotificationPreferences,
          ...preferencesResult,
          userId, // ✅ Koristimo provereni userId
          contractExpiring: { 
            ...defaultNotificationPreferences.contractExpiring, 
            ...preferencesResult?.contractExpiring 
          },
          contractRenewalStatusChange: { 
            ...defaultNotificationPreferences.contractRenewalStatusChange, 
            ...preferencesResult?.contractRenewalStatusChange 
          },
          complaintAssigned: { 
            ...defaultNotificationPreferences.complaintAssigned, 
            ...preferencesResult?.complaintAssigned 
          },
          complaintUpdated: { 
            ...defaultNotificationPreferences.complaintUpdated, 
            ...preferencesResult?.complaintUpdated 
          },
          reminder: { 
            ...defaultNotificationPreferences.reminder, 
            ...preferencesResult?.reminder 
          },
          system: { 
            ...defaultNotificationPreferences.system, 
            ...preferencesResult?.system 
          },
      };
  }

  return (
    <div className="container mx-auto py-8">
      {/* Pass the fetched or default preferences to the Client Component */}
      <NotificationSettings initialPreferences={userPreferences} />
    </div>
  );
}