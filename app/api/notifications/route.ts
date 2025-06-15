////app/api/notifications/route.ts


import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NotificationType } from "@prisma/client";

// Schema for creating a notification
const CreateNotificationSchema = z.object({
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  type: z.nativeEnum(NotificationType),
  userId: z.string().cuid(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
});

// Schema for querying notifications
const GetNotificationsSchema = z.object({
  userId: z.string().cuid().optional(),
  type: z.nativeEnum(NotificationType).optional(),
  isRead: z.boolean().optional(),
  limit: z.number().int().positive().default(20),
  offset: z.number().int().nonnegative().default(0),
});

// GET handler to retrieve notifications
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Only admins can query other users' notifications
    const isAdmin = session.user.role === "ADMIN";
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId") || session.user.id;
    const type = searchParams.get("type") as NotificationType | null;
    const isReadParam = searchParams.get("isRead");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    
    // Validate parameters
    const validatedParams = GetNotificationsSchema.parse({
      userId: userId,
      type: type || undefined,
      isRead: isReadParam ? isReadParam === "true" : undefined,
      limit,
      offset,
    });
    
    // If not admin and trying to access another user's notifications
    if (!isAdmin && validatedParams.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    // Build the query
    const where: any = { userId: validatedParams.userId };
    
    if (validatedParams.type) {
      where.type = validatedParams.type;
    }
    
    if (validatedParams.isRead !== undefined) {
      where.isRead = validatedParams.isRead;
    }
    
    // Execute the query
    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: validatedParams.limit,
      skip: validatedParams.offset,
    });
    
    // Get total count for pagination
    const totalCount = await db.notification.count({ where });
    
    return NextResponse.json({
      notifications,
      meta: {
        total: totalCount,
        limit: validatedParams.limit,
        offset: validatedParams.offset,
      },
    });
  } catch (error) {
    console.error("Error retrieving notifications:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request parameters" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to retrieve notifications" }, { status: 500 });
  }
}

// POST handler to create a notification
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Only admins can create notifications for other users
    const isAdmin = session.user.role === "ADMIN";
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate request data
    const validatedData = CreateNotificationSchema.parse(body);
    
    // Create the notification
    const notification = await db.notification.create({
      data: {
        title: validatedData.title,
        message: validatedData.message,
        type: validatedData.type,
        userId: validatedData.userId,
        entityType: validatedData.entityType,
        entityId: validatedData.entityId,
      },
    });
    
    // Log the activity
    await db.activityLog.create({
      data: {
        action: "CREATE_NOTIFICATION",
        entityType: "NOTIFICATION",
        entityId: notification.id,
        details: `Created notification "${notification.title}" for user ${notification.userId}`,
        userId: session.user.id,
      },
    });
    
    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error("Error creating notification:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid notification data", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 });
  }
}

// DELETE handler to delete all read notifications for a user
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get user ID from query parameters
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId") || session.user.id;
    
    // Only admins can delete other users' notifications
    const isAdmin = session.user.role === "ADMIN";
    if (!isAdmin && userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    // Delete read notifications for the user
    const result = await db.notification.deleteMany({
      where: {
        userId,
        isRead: true,
      },
    });
    
    // Log the activity
    await db.activityLog.create({
      data: {
        action: "DELETE_NOTIFICATIONS",
        entityType: "NOTIFICATION",
        details: `Deleted ${result.count} read notifications for user ${userId}`,
        userId: session.user.id,
      },
    });
    
    return NextResponse.json({
      success: true,
      message: `Deleted ${result.count} read notifications`,
      count: result.count,
    });
  } catch (error) {
    console.error("Error deleting notifications:", error);
    return NextResponse.json({ error: "Failed to delete notifications" }, { status: 500 });
  }
}