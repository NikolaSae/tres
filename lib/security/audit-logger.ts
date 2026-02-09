// lib/security/audit-logger.ts
import { db } from "@/lib/db";
import { LogSeverity } from "@prisma/client";
import { getCurrentUser } from "./auth-helpers";

interface LogOptions {
  entityType: string;
  entityId?: string;
  details?: string | Record<string, any>;  // ← dozvoljeno i string i objekat
  severity?: LogSeverity;
  userId?: string;
}

interface ActivityLogParams {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  severity?: LogSeverity;
}

/**
 * Loguje aktivnost u bazi – koristi se za praćenje akcija korisnika
 * @param action - Naziv akcije (npr. "DELETE", "CREATE", "UPDATE")
 * @param options - Dodatni parametri
 */
export async function logActivity(
  action: string,
  options: LogOptions
) {
  let userId = options.userId;

  // Ako nije prosleđen userId, pokušaj da dohvatiš trenutnog korisnika
  if (!userId) {
    const user = await getCurrentUser();
    if (!user?.id) {
      console.error("No authenticated user for activity log");
      return;
    }
    userId = user.id;
  }

  const { entityType, entityId, details, severity = LogSeverity.INFO } = options;

  // Pripremi details – ako je objekat, pretvori u JSON string
  let detailsString: string | null = null;
  if (details) {
    if (typeof details === 'string') {
      detailsString = details;
    } else {
      try {
        detailsString = JSON.stringify(details);
      } catch (e) {
        console.error("Failed to stringify details for log:", e);
        detailsString = "Error serializing details";
      }
    }
  }

  return db.activityLog.create({
    data: {
      action,
      entityType,
      entityId,
      details: detailsString,      // ← sada je string | null
      severity,
      userId,
    },
  });
}

/**
 * Alternativna funkcija za logovanje sa više detalja
 */
export async function createActivityLog({
  userId,
  action,
  resource,
  resourceId,
  details,
  severity = LogSeverity.INFO,
}: ActivityLogParams) {
  let detailsString: string | null = null;
  if (details) {
    try {
      detailsString = JSON.stringify(details);
    } catch (e) {
      console.error("Failed to stringify details:", e);
      detailsString = "Error serializing details";
    }
  }

  return db.activityLog.create({
    data: {
      action,
      entityType: resource,
      entityId: resourceId,
      details: detailsString,
      severity,
      userId,
    },
  });
}