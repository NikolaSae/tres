///app/api/security/permissions/route.ts


import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";
import { z } from "zod";

// Define permissions schema based on role
const permissionsByRole = {
  ADMIN: {
    // Admin has all permissions
    contracts: ["view", "create", "update", "delete", "manage"],
    providers: ["view", "create", "update", "delete", "manage"],
    services: ["view", "create", "update", "delete", "manage"],
    complaints: ["view", "create", "update", "delete", "assign", "resolve", "manage"],
    reports: ["view", "create", "schedule", "manage"],
    analytics: ["view", "export", "manage"],
    users: ["view", "create", "update", "delete", "manage"],
    securityLogs: ["view", "purge", "manage"],
    notifications: ["view", "create", "manage"],
    humanitarianOrgs: ["view", "create", "update", "delete", "manage"],
    parkingServices: ["view", "create", "update", "delete", "manage"],
  },
  MANAGER: {
    contracts: ["view", "create", "update"],
    providers: ["view", "create", "update"],
    services: ["view", "create", "update"],
    complaints: ["view", "create", "update", "assign", "resolve"],
    reports: ["view", "create", "schedule"],
    analytics: ["view", "export"],
    users: ["view"],
    securityLogs: ["view"],
    notifications: ["view", "create"],
    humanitarianOrgs: ["view", "create", "update"],
    parkingServices: ["view", "create", "update"],
  },
  AGENT: {
    contracts: ["view"],
    providers: ["view"],
    services: ["view"],
    complaints: ["view", "create", "update", "assign", "resolve"],
    reports: ["view"],
    analytics: ["view"],
    users: [],
    securityLogs: [],
    notifications: ["view"],
    humanitarianOrgs: ["view"],
    parkingServices: ["view"],
  },
  USER: {
    contracts: [],
    providers: ["view"],
    services: ["view"],
    complaints: ["view", "create"],
    reports: [],
    analytics: [],
    users: [],
    securityLogs: [],
    notifications: ["view"],
    humanitarianOrgs: ["view"],
    parkingServices: ["view"],
  },
};

// Schema for checking permissions
const checkPermissionSchema = z.object({
  resource: z.string().min(1, "Resource is required"),
  action: z.string().min(1, "Action is required"),
  userId: z.string().optional(), // Optional - only for admins to check other users
});

// Schema for updating role
const updateRoleSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: z.enum(["ADMIN", "MANAGER", "AGENT", "USER"]),
});

// GET endpoint to retrieve a user's permissions
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    // Check authentication
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const url = new URL(request.url);
    const resource = url.searchParams.get("resource");
    const targetUserId = url.searchParams.get("userId") || session.user.id;

    // Only admins can check permissions for other users
    if (targetUserId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // If admin is checking another user, get that user's role
    let targetUserRole: UserRole = session.user.role as UserRole;
    
    if (targetUserId !== session.user.id) {
      const targetUser = await db.user.findUnique({
        where: { id: targetUserId },
        select: { role: true },
      });

      if (!targetUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      targetUserRole = targetUser.role;
    }

    // Get all permissions for the role
    const permissions = permissionsByRole[targetUserRole];

    // If a specific resource is requested, filter for that resource
    if (resource && permissions[resource]) {
      return NextResponse.json({
        userId: targetUserId,
        role: targetUserRole,
        permissions: { [resource]: permissions[resource] },
      });
    }

    // Otherwise return all permissions
    return NextResponse.json({
      userId: targetUserId,
      role: targetUserRole,
      permissions,
    });
  } catch (error) {
    console.error("Error retrieving permissions:", error);
    return NextResponse.json(
      { error: "Failed to retrieve permissions" },
      { status: 500 }
    );
  }
}

// POST endpoint to check if a user has a specific permission
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    // Check authentication
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();

    // Validate request body
    const validatedData = checkPermissionSchema.parse(body);

    let targetUserId = validatedData.userId || session.user.id;
    let targetUserRole: UserRole = session.user.role as UserRole;

    // Only admins can check permissions for other users
    if (targetUserId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // If checking another user, get that user's role
    if (targetUserId !== session.user.id) {
      const targetUser = await db.user.findUnique({
        where: { id: targetUserId },
        select: { role: true },
      });

      if (!targetUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      targetUserRole = targetUser.role;
    }

    // Check if the resource exists in permissions
    const resourcePermissions = permissionsByRole[targetUserRole][validatedData.resource];
    
    if (!resourcePermissions) {
      return NextResponse.json({ hasPermission: false });
    }

    // Check if the action is allowed for this resource
    const hasPermission = resourcePermissions.includes(validatedData.action);

    // Log the permission check
    await db.activityLog.create({
      data: {
        action: "PERMISSION_CHECK",
        entityType: "PERMISSION",
        details: `Checked if user has permission ${validatedData.action} for ${validatedData.resource}. Result: ${hasPermission}`,
        severity: "INFO",
        userId: session.user.id,
      },
    });

    return NextResponse.json({ hasPermission });
  } catch (error) {
    console.error("Error checking permission:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to check permission" },
      { status: 500 }
    );
  }
}

// PATCH endpoint to update a user's role (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    // Check authentication and admin permission
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate request body
    const validatedData = updateRoleSchema.parse(body);

    // Prevent changing own role (security measure)
    if (validatedData.userId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot change your own role" },
        { status: 400 }
      );
    }

    // Update user role
    const updatedUser = await db.user.update({
      where: { id: validatedData.userId },
      data: { role: validatedData.role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    // Log the role change
    await db.activityLog.create({
      data: {
        action: "ROLE_UPDATE",
        entityType: "USER",
        entityId: updatedUser.id,
        details: `Changed user role to ${validatedData.role}`,
        severity: "WARNING",
        userId: session.user.id,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user role:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    // Handle Prisma errors like not found
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "User not found" }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to update user role" },
      { status: 500 }
    );
  }
}