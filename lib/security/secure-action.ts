// lib/security/secure-action.ts

"use server";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { logActivity } from "./audit-logger";
import { canPerformAction } from "./permission-checker";
import { rateLimit, RATE_LIMIT_CONFIGS } from "./rate-limiter";
import { LogSeverity, UserRole } from "@prisma/client";
import { NextRequest } from "next/server";

type RateLimitKey = keyof typeof RATE_LIMIT_CONFIGS;

// EntityType i ActionType iz permission-checker-a
type EntityType = "contract" | "complaint" | "service" | "provider" |
                  "humanitarian" | "report" | "user" | "analytics";
type ActionType = "view" | "create" | "update" | "delete";

interface SecureActionOptions {
  // Permission provera — format "entityType:action" npr. "contract:create"
  permission?: `${EntityType}:${ActionType}`;
  // ID entiteta za granularnu proveru (npr. vlasnik complaint-a)
  entityId?: string;
  // Rate limit konfiguracija
  rateLimit?: RateLimitKey;
  // Da li da loguje akciju u ActivityLog
  audit?: boolean;
  // Naziv akcije za audit log (default: ime funkcije)
  auditAction?: string;
}

interface AuthenticatedUser {
  id: string;
  email: string | null;
  role: string;
  name?: string | null;
}

type SecureActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: 401 | 403 | 429 | 500 };

// ============================================================
// GLAVNI WRAPPER
// ============================================================
export function secureAction<TInput, TOutput>(
  options: SecureActionOptions,
  handler: (user: AuthenticatedUser, input: TInput) => Promise<TOutput>
) {
  return async (input: TInput): Promise<SecureActionResult<TOutput>> => {
    try {
      // 1. AUTH PROVERA
      const session = await auth();
      if (!session?.user?.id) {
        return { success: false, error: "Niste autentifikovani", code: 401 };
      }

      const user: AuthenticatedUser = {
        id: session.user.id,
        email: session.user.email ?? null,
        role: (session.user.role as string) ?? "USER",
        name: session.user.name ?? null,
      };

      // 2. isActive PROVERA
      if (session.user.isActive === false) {
        return { success: false, error: "Nalog je deaktiviran", code: 403 };
      }

      // 3. PERMISSION PROVERA
      if (options.permission) {
        const [entityType, actionType] = options.permission.split(":") as [EntityType, ActionType];
        const allowed = await canPerformAction(entityType, actionType, options.entityId);
        if (!allowed) {
          // Loguj neovlašćen pokušaj
          await logActivity("UNAUTHORIZED_ACCESS", {
            entityType,
            details: {
              attemptedAction: options.permission,
              userId: user.id,
              role: user.role,
            },
            severity: LogSeverity.WARNING,
            userId: user.id,
          }).catch(() => {}); // ne sme da sruši flow

          return { success: false, error: "Nemate dozvolu za ovu akciju", code: 403 };
        }
      }

      // 4. RATE LIMITING (za Server Actions koristimo userId kao identifier)
      if (options.rateLimit) {
        const config = RATE_LIMIT_CONFIGS[options.rateLimit];
        const headersList = await headers();
        const ip =
          headersList.get("x-forwarded-for")?.split(",")[0].trim() ||
          headersList.get("x-real-ip") ||
          user.id;

        // Simuliramo NextRequest za rate limiter
        const fakeReq = {
          headers: {
            get: (key: string) => headersList.get(key),
          },
        } as unknown as NextRequest;

        const rl = await rateLimit(fakeReq, `action:${user.id}`, config);
        if (!rl.success) {
          return {
            success: false,
            error: "Previše zahteva. Pokušajte ponovo za kratko vreme.",
            code: 429,
          };
        }
      }

      // 5. IZVRŠI AKCIJU
      const data = await handler(user, input);

      // 6. AUDIT LOG (nakon uspešne akcije)
      if (options.audit !== false && options.auditAction) {
        const entityInfo = options.permission?.split(":")[0] ?? "unknown";
        await logActivity(options.auditAction, {
          entityType: entityInfo,
          details: typeof input === "object" && input !== null
            ? (input as Record<string, unknown>)
            : { input: String(input) },
          severity: LogSeverity.INFO,
          userId: user.id,
        }).catch(() => {}); // ne sme da sruši flow
      }

      return { success: true, data };
    } catch (error) {
      console.error("[SECURE_ACTION_ERROR]", error);
      return {
        success: false,
        error: "Interna greška servera",
        code: 500,
      };
    }
  };
}
