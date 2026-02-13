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

const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  allowedRoles = [],
  fallback = null,
}) => {
  const { data: session, status } = useSession();
  
  // Full type assertion to bypass TypeScript error
  const userRole = (session?.user as any)?.role as UserRole | undefined;
  
  if (status === "loading") {
    return <div className="animate-pulse p-4">Loading permissions...</div>;
  }
  
  if (status !== "authenticated" || !session) {
    return <>{fallback}</>;
  }
  
  if (userRole === UserRole.ADMIN) {
    return <>{children}</>;
  }
  
  const hasPermission = allowedRoles.length === 0 || (userRole && allowedRoles.includes(userRole));
  
  return hasPermission ? <>{children}</> : <>{fallback}</>;
};

export default PermissionGate;