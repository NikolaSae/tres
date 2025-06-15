// lib/auth/auth-utils.ts
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

export async function getCurrentUser() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return null;
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    return user;
  } catch (error) {
    console.error("[getCurrentUser] Error:", error);
    return null;
  }
}

export async function getUserRole(): Promise<UserRole | null> {
  try {
    const session = await auth();
    
    console.log("[GET_USER_ROLE] Session debug:", {
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      roleInSession: (session?.user as any)?.role
    });

    // First try to get role from session
    if (session?.user && 'role' in session.user) {
      const roleFromSession = (session.user as any).role;
      console.log("[GET_USER_ROLE] Role from session:", roleFromSession);
      return roleFromSession;
    }

    // Fallback: get from database
    if (session?.user?.id) {
      console.log("[GET_USER_ROLE] Role not in session, fetching from DB");
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, id: true, email: true },
      });
      
      console.log("[GET_USER_ROLE] DB User:", user);
      return user?.role || null;
    }

    console.log("[GET_USER_ROLE] No session or user ID");
    return null;
  } catch (error) {
    console.error("[GET_USER_ROLE] Error:", error);
    return null;
  }
}

export async function hasRequiredRole(requiredRoles: UserRole[]): Promise<boolean> {
  try {
    const userRole = await getUserRole();
    const hasAccess = userRole ? requiredRoles.includes(userRole) : false;
    
    console.log("[hasRequiredRole] Access check:", {
      userRole,
      requiredRoles,
      hasAccess
    });
    
    return hasAccess;
  } catch (error) {
    console.error("[hasRequiredRole] Error:", error);
    return false;
  }
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }
  return session;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await requireAuth();
  const userRole = await getUserRole();
  
  if (!userRole || !allowedRoles.includes(userRole)) {
    redirect("/dashboard");
  }
  
  return { session, userRole };
}