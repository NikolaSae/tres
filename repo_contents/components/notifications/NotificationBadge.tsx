///components/notifications/NotificationBadge.tsx

"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import NotificationList from "./NotificationList";
import { Notification } from "@/lib/types/notification-types";

interface NotificationBadgeProps {
  initialCount?: number;
  initialNotifications?: Notification[];
  fetchNotifications?: () => Promise<Notification[]>;
}

export default function NotificationBadge({
  initialCount = 0,
  initialNotifications = [],
  fetchNotifications,
}: NotificationBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(initialCount);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [isLoading, setIsLoading] = useState(false);

  const loadNotifications = async () => {
    if (!fetchNotifications) return;
    
    setIsLoading(true);
    try {
      const data = await fetchNotifications();
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.isRead).length);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initialize unread count from props
    setUnreadCount(initialNotifications.filter(n => !n.isRead).length);
  }, [initialNotifications]);

  // When the popover opens, fetch fresh notifications if possible
  useEffect(() => {
    if (isOpen && fetchNotifications) {
      loadNotifications();
    }
  }, [isOpen, fetchNotifications]);

  const handleNotificationRead = () => {
    // Update unread count when a notification is read
    const newUnreadCount = notifications.filter(n => !n.isRead).length - 1;
    setUnreadCount(Math.max(0, newUnreadCount));
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger className="relative inline-flex items-center p-2 rounded-md">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="bg-blue-600 text-white p-3 font-medium">
          Obaveštenja
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center">
              <span className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></span>
              <p className="mt-2 text-sm">Učitavanje obaveštenja...</p>
            </div>
          ) : (
            <NotificationList 
              notifications={notifications} 
              onNotificationRead={handleNotificationRead} 
            />
          )}
        </div>
        <div className="border-t border-gray-100 p-2">
          <a 
            href="/notifications" 
            className="block text-center text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            Prikaži sva obaveštenja
          </a>
        </div>
      </PopoverContent>
    </Popover>
  );
}