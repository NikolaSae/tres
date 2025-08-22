///components/notifications/NotificationList.tsx 

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCircle, AlertTriangle, Info, Calendar, MessageSquare } from "lucide-react";
import { Notification, NotificationType } from "@/lib/types/notification-types";
import { markAsRead } from "@/actions/notifications/mark-as-read";

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
        await markAsRead(notification.id);
        
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
      <div className="p-4 text-center text-gray-500">
        <Bell className="h-10 w-10 mx-auto mb-2 text-gray-300" />
        <p>Nema novih obaveštenja</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
      {currentNotifications.map((notification) => (
        <li 
          key={notification.id}
          onClick={() => handleNotificationClick(notification)}
          className={`flex gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
            notification.isRead ? "bg-white" : "bg-blue-50"
          }`}
        >
          <div className="flex-shrink-0 mt-1">
            {getNotificationIcon(notification.type)}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 line-clamp-1">
              {notification.title}
            </p>
            <p className="text-sm text-gray-500 line-clamp-2">
              {notification.message}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </p>
          </div>

          {notification.isRead && (
            <div className="flex-shrink-0">
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}