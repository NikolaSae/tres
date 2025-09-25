// Path: app/(protected)/notifications/page.tsx
import { Suspense } from 'react';
import { Metadata } from 'next';
import { getCurrentUser } from '@/lib/security/auth-helpers';
import NotificationList from '@/components/notifications/NotificationList';
import { Loader2 } from "lucide-react";
import { getNotificationsByUserId } from '@/actions/notifications/get-by-user-id';

export const metadata: Metadata = {
  title: 'Notifications | Service Management',
  description: 'View and manage your notifications',
};

export default async function NotificationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    return <div>Unauthorized</div>;
  }

  const notificationsResult = await getNotificationsByUserId(user.id);

  if (notificationsResult && 'error' in notificationsResult) {
      console.error("Failed to fetch notifications:", notificationsResult.error);
      return <div className="container mx-auto py-8 text-center text-red-500">Error loading notifications.</div>;
  }

  const notifications = notificationsResult || [];

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>

      <Suspense fallback={<div className="flex justify-center my-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
        <NotificationList notifications={notifications} />
      </Suspense>
    </div>
  );
}
