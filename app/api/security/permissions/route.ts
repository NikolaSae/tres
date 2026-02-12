// app/api/security/permissions/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UserRole } from '@prisma/client';

// Define permissions type
type PermissionSet = {
  contracts: string[];
  providers: string[];
  services: string[];
  complaints: string[];
  reports: string[];
  analytics: string[];
  users: string[];
  securityLogs: string[];
  notifications: string[];
  humanitarianOrgs: string[];
  parkingServices: string[];
  [key: string]: string[]; // Index signature
};

const ROLE_PERMISSIONS: Record<UserRole, PermissionSet> = {
  ADMIN: {
    contracts: ['view', 'create', 'edit', 'delete', 'approve'],
    providers: ['view', 'create', 'edit', 'delete'],
    services: ['view', 'create', 'edit', 'delete'],
    complaints: ['view', 'create', 'edit', 'delete', 'assign', 'resolve'],
    reports: ['view', 'create', 'export'],
    analytics: ['view', 'export'],
    users: ['view', 'create', 'edit', 'delete', 'manage_roles'],
    securityLogs: ['view', 'export'],
    notifications: ['view', 'create', 'send'],
    humanitarianOrgs: ['view', 'create', 'edit', 'delete'],
    parkingServices: ['view', 'create', 'edit', 'delete'],
  },
  MANAGER: {
    contracts: ['view', 'create', 'edit', 'approve'],
    providers: ['view', 'create', 'edit'],
    services: ['view', 'create', 'edit'],
    complaints: ['view', 'create', 'edit', 'assign', 'resolve'],
    reports: ['view', 'create', 'export'],
    analytics: ['view', 'export'],
    users: ['view'],
    securityLogs: ['view'],
    notifications: ['view', 'create'],
    humanitarianOrgs: ['view', 'create', 'edit'],
    parkingServices: ['view', 'create', 'edit'],
  },
  AGENT: {
    contracts: ['view'],
    providers: ['view'],
    services: ['view'],
    complaints: ['view', 'create', 'edit', 'resolve'],
    reports: ['view'],
    analytics: ['view'],
    users: [],
    securityLogs: [],
    notifications: ['view'],
    humanitarianOrgs: ['view'],
    parkingServices: ['view'],
  },
  USER: {
    contracts: [],
    providers: [],
    services: ['view'],
    complaints: ['view', 'create'],
    reports: [],
    analytics: [],
    users: [],
    securityLogs: [],
    notifications: ['view'],
    humanitarianOrgs: [],
    parkingServices: [],
  },
};

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const resource = searchParams.get('resource');
    const action = searchParams.get('action');

    const userRole = session.user.role as UserRole;
    const permissions = ROLE_PERMISSIONS[userRole];

    // If specific resource and action are queried
    if (resource && action) {
      const hasPermission = permissions[resource]?.includes(action) || false;
      return NextResponse.json({ hasPermission });
    }

    // If only resource is queried
    if (resource) {
      const resourcePermissions = permissions[resource] || [];
      return NextResponse.json({ permissions: resourcePermissions });
    }

    // Return all permissions for the user's role
    return NextResponse.json({ permissions });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins can check permissions for other users
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { role, resource, action } = body;

    if (!role) {
      return NextResponse.json(
        { error: 'Role is required' },
        { status: 400 }
      );
    }

    const permissions = ROLE_PERMISSIONS[role as UserRole];

    if (!permissions) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // If specific resource and action are queried
    if (resource && action) {
      const hasPermission = (permissions[resource as keyof PermissionSet] as string[])?.includes(action) || false;
      return NextResponse.json({ hasPermission });
    }

    // If only resource is queried
    if (resource) {
      const resourcePermissions = permissions[resource as keyof PermissionSet] || [];
      return NextResponse.json({ permissions: resourcePermissions });
    }

    // Return all permissions for the role
    return NextResponse.json({ permissions });
  } catch (error) {
    console.error('Error checking permissions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}