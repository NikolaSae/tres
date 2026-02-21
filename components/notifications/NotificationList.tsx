///components/notifications/NotificationList.tsx 

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { sr } from "date-fns/locale"; // Dodaj srpski locale
import { Bell, CheckCircle, AlertTriangle, Info, Calendar, MessageSquare } from "lucide-react";
import { Notification, NotificationType } from "@/lib/types/notification-types";
import { markAsRead } from "@/actions/notifications/mark-as-read";
import { cn } from "@/lib/utils";

interface NotificationListProps {
  notifications: Notification[];
  onNotificationRead?: () => void;
}

export default function NotificationList({ 
  notifications, 
  onNotificationRead 
}: NotificationListProps) {
  const router = useRouter();
  const [currentNotifications, setCurrentNotifications] = useState(notifications);

  useEffect(() => {
    setCurrentNotifications(notifications);
  }, [notifications]);

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "CONTRACT_EXPIRING":
      case "CONTRACT_RENEWAL_STATUS_CHANGE":
        return <Calendar className="h-5 w-5 text-yellow-500" />;
      case "COMPLAINT_ASSIGNED":
      case "COMPLAINT_UPDATED":
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case "REMINDER":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case "SYSTEM":
        return <Info className="h-5 w-5 text-gray-500" />;
      default:
        return <Bell className="h-5 w-5 text-indigo-500" />;
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark notification as read
    if (!notification.isRead) {
      try {
        await markAsRead({ id: notification.id });
        
        // Update local state
        setCurrentNotifications(
          currentNotifications.map(n => 
            n.id === notification.id ? { ...n, isRead: true } : n
          )
        );
        
        // Notify parent component
        if (onNotificationRead) {
          onNotificationRead();
        }
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }

    // Navigate to the entity if available
    if (notification.entityType && notification.entityId) {
      switch (notification.entityType) {
        case "contract":
          router.push(`/contracts/${notification.entityId}`);
          break;
        case "complaint":
          router.push(`/complaints/${notification.entityId}`);
          break;
        case "renewal":
          router.push(`/contracts/expiring`);
          break;
        default:
          break;
      }
    }
  };

  if (currentNotifications.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <Bell className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">
          Nema notifikacija
        </h3>
        <p className="text-sm text-gray-500">
          Sve notifikacije će se prikazati ovde
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-200">
      {currentNotifications.map((notification) => (
        <li 
          key={notification.id}
          onClick={() => handleNotificationClick(notification)}
          className={cn(
            "flex gap-4 p-4 cursor-pointer transition-colors",
            "hover:bg-gray-50 active:bg-gray-100",
            notification.isRead 
              ? "bg-white" 
              : "bg-blue-50 border-l-4 border-l-blue-500"
          )}
        >
          <div className="flex-shrink-0 mt-1">
            {getNotificationIcon(notification.type)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-gray-900">
                {notification.title}
              </p>
              {!notification.isRead && (
                <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
              )}
            </div>
            
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {notification.message}
            </p>
            
            <p className="text-xs text-gray-400 mt-2">
              {formatDistanceToNow(new Date(notification.createdAt), { 
                addSuffix: true,
                locale: sr // Srpski locale
              })}
            </p>
          </div>

          {notification.isRead && (
            <div className="flex-shrink-0 self-center">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}