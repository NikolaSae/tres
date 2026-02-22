//actions/admin.ts
"use server";

import { currentRole, currentUser } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { logActivity } from "@/lib/security/audit-logger";
import { LogSeverity } from "@prisma/client";

export const admin = async () => {
  const role = await currentRole();

  if (role !== UserRole.ADMIN) {
    // ✅ Loguj neovlašćen pokušaj pristupa admin akciji
    const user = await currentUser();
    await logActivity("UNAUTHORIZED_ADMIN_ACCESS", {
      entityType: "admin",
      details: { attemptedRole: role ?? "unknown" },
      severity: LogSeverity.WARNING,
      userId: user?.id,
    }).catch(() => {});

    return { error: "Forbidden Server Action!" };
  }

  return { success: "Allowed Server Action!" };
};