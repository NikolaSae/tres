///app/api/notifications/push/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkPermission } from "@/actions/security/check-permission";
import { getCurrentUser } from "@/lib/auth";
import { NotificationType, LogSeverity } from "@prisma/client";
import { sendPushNotification } from "@/lib/notifications/in-app-notifier";
import { logActivity } from "@/lib/security/audit-logger";

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // ISPRAVKA: Promenjen redosled parametara - prvo permission name, pa userId
    const hasPermission = await checkPermission("send_system_notification", currentUser.id);
    
    if (!hasPermission) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    
    const body = await req.json();
    const { userId, title, message, type, entityType, entityId } = body;
    
    if (!userId || !title || !message || !type) {
      return new NextResponse("Missing required fields", { status: 400 });
    }
    
    // Validate notification type
    if (!Object.values(NotificationType).includes(type as NotificationType)) {
      return new NextResponse("Invalid notification type", { status: 400 });
    }
    
    // Create notification in DB
    const notification = await db.notification.create({
      data: {
        userId,
        title,
        message,
        type: type as NotificationType,
        entityType,
        entityId,
        isRead: false,
      }
    });
    
    // Send real-time notification if applicable
    await sendPushNotification(userId, notification);
    
    // Log the event
    await logActivity("SEND_PUSH_NOTIFICATION", {
      entityType: "notification",
      entityId: notification.id,
      details: `Push notification sent to user ${userId}`,
      severity: LogSeverity.INFO,
      userId: currentUser.id
    });
    
    return NextResponse.json({ success: true, notification });
  } catch (error) {
    console.error("[PUSH_NOTIFICATION_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || currentUser.id;
    const type = searchParams.get("type");
    const isRead = searchParams.get("isRead");
    const limit = parseInt(searchParams.get("limit") || "10");
    
    // Only admins or the user themselves can access their notifications
    if (userId !== currentUser.id && currentUser.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }
    
    // Build query
    const query: any = { userId };
    
    if (type) {
      query.type = type;
    }
    
    if (isRead !== null) {
      query.isRead = isRead === "true";
    }
    
    const notifications = await db.notification.findMany({
      where: query,
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    
    return NextResponse.json(notifications);
  } catch (error) {
    console.error("[GET_NOTIFICATIONS_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const body = await req.json();
    const { id, isRead } = body;
    
    if (!id) {
      return new NextResponse("Notification ID is required", { status: 400 });
    }
    
    // Get the notification
    const notification = await db.notification.findUnique({
      where: { id }
    });
    
    if (!notification) {
      return new NextResponse("Notification not found", { status: 404 });
    }
    
    // Check if current user owns this notification
    if (notification.userId !== currentUser.id && currentUser.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }
    
    // Update notification
    const updatedNotification = await db.notification.update({
      where: { id },
      data: { isRead: isRead !== undefined ? isRead : true }
    });
    
    return NextResponse.json(updatedNotification);
  } catch (error) {
    console.error("[UPDATE_NOTIFICATION_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
