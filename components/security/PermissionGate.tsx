///components/security/PermissionGate.tsx

"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { UserRole } from "@prisma/client";

interface PermissionGateProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  fallback?: React.ReactNode;
}

/**
 * A component that conditionally renders children based on user role permissions
 * 
 * @param children - Content to show if user has permission
 * @param allowedRoles - Array of roles that are allowed to view the content
 * @param fallback - Optional content to show if user doesn't have permission
 */
const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  allowedRoles = [],
  fallback = null,
}) => {
  const { data: session, status } = useSession();
  const userRole = session?.user?.role as UserRole | undefined;
  
  // Loading state
  if (status === "loading") {
    return <div className="animate-pulse p-4">Loading permissions...</div>;
  }
  
  // Not authenticated
  if (status !== "authenticated" || !session) {
    return <>{fallback}</>;
  }
  
  // Always allow ADMIN role
  if (userRole === UserRole.ADMIN) {
    return <>{children}</>;
  }
  
  // Check if user role is in allowed roles
  const hasPermission = allowedRoles.length === 0 || (userRole && allowedRoles.includes(userRole));
  
  return hasPermission ? <>{children}</> : <>{fallback}</>;
};

export default PermissionGate;