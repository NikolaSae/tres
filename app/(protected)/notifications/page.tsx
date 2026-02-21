import { Suspense } from 'react';
import { Metadata } from 'next';
import { getCurrentUser } from '@/lib/security/auth-helpers';
import NotificationList from '@/components/notifications/NotificationList';
import { Button } from '@/components/ui/button';
import { CheckCheck, Loader2 } from "lucide-react";
import { getNotificationsByUserId } from '@/actions/notifications/get-by-user-id';
import { markAsRead } from '@/actions/notifications/mark-as-read';

export const metadata: Metadata = {
  title: 'Notifications | Service Management',
  description: 'View and manage your notifications',
};

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  
  if (!user || !user.id) {
    return <div>Unauthorized</div>;
  }

  const notificationsResult = await getNotificationsByUserId(user.id);
  
  if (notificationsResult && 'error' in notificationsResult) {
    console.error("Failed to fetch notifications:", notificationsResult.error);
    return (
      <div className="container mx-auto py-8 text-center text-red-500">
        Error loading notifications.
      </div>
    );
  }

  const notifications = notificationsResult || [];
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Notifikacije</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {unreadCount} nepročitanih
            </p>
          )}
        </div>
        
        {unreadCount > 0 && (
          <form action={async () => {
            "use server";
            await markAsRead({ markAllAsRead: true });
          }}>
            <Button 
              type="submit"
              variant="outline" 
              size="sm"
              className="gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              Označi sve kao pročitano
            </Button>
          </form>
        )}
      </div>

      <Suspense 
        fallback={
          <div className="flex justify-center my-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        }
      >
        <div className="bg-white rounded-lg border shadow-sm">
          <NotificationList notifications={notifications} />
        </div>
      </Suspense>
    </div>
  );
}