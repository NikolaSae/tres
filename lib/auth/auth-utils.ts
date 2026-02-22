// lib/auth/auth-utils.ts
import { connection } from 'next/server';
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

export async function getCurrentUser() {
  try {
    const session = await auth();
    if (!session?.user?.id) return null;

    return await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, role: true, isActive: true },
    });
  } catch (error) {
    console.error("[getCurrentUser] Error:", error);
    return null;
  }
}

export async function getUserRole(): Promise<UserRole | null> {
  await connection();
  try {
    const session = await auth();

    if (session?.user && 'role' in session.user) {
      return (session.user as any).role;
    }

    if (session?.user?.id) {
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      });
      return user?.role || null;
    }

    return null;
  } catch (error) {
    console.error("[GET_USER_ROLE] Error:", error);
    return null;
  }
}

export async function hasRequiredRole(requiredRoles: UserRole[]): Promise<boolean> {
  try {
    const userRole = await getUserRole();
    return userRole ? requiredRoles.includes(userRole) : false;
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