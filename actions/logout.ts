//actions/logout.ts
"use server";

import { signOut, auth } from "@/auth";
import { logActivity } from "@/lib/security/audit-logger";
import { LogSeverity } from "@prisma/client";

export const logout = async () => {
  // Dohvati sesiju pre odjave da možemo da logujemo userId
  const session = await auth();

  if (session?.user?.id) {
    await logActivity("LOGOUT", {
      entityType: "auth",
      entityId: session.user.id,
      severity: LogSeverity.INFO,
      userId: session.user.id,
    }).catch(() => {});
  }

  await signOut({ redirectTo: "/auth/login" });
};