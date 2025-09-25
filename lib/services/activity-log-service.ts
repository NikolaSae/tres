// lib/services/activity-log-service.ts

import { db } from "@/lib/db"; // Uvoz tvoje Prisma klijent instance
import { LogSeverity, LogActionType, LogEntityType } from "@prisma/client"; // Uvoz LogSeverity, LogActionType, LogEntityType enum-a
// Uklonjeno: import { getCurrentUser } from "@/lib/session"; // Više se ne dohvaća korisnik unutar ove akcije

// Definicija parametara koje log metoda prihvata
// userId je sada OBAVEZAN
interface ActivityLogParams {
  action: LogActionType; // Naziv akcije koja se loguje (npr. 'CREATE_BULK_SERVICE', 'USER_LOGIN', 'UPDATE_CONTRACT')
  entityType: LogEntityType; // Tip entiteta na koji se akcija odnosi (npr. 'BULK_SERVICE', 'USER', 'CONTRACT')
  entityId: string | null; // ID entiteta (može biti null ako akcija nije vezana za specifičan entitet)
  details?: string; // Dodatni detalji o akciji (opciono)
  severity?: LogSeverity; // Nivo ozbiljnosti loga (INFO, WARNING, ERROR, itd.), podrazumevano INFO
  userId: string; // OBAVEZNO: ID korisnika koji je izvršio akciju. Mora biti prosleđen.
}

/**
 * Servis za logovanje aktivnosti korisnika i sistema.
 * Pruža statičku metodu `log` za kreiranje zapisa u `ActivityLog` tabeli.
 */
export const ActivityLogService = {
  /**
   * Kreira novi zapis u tabeli `ActivityLog`.
   *
   * @param params - Objekat sa detaljima o logu (action, entityType, entityId, details, severity, userId).
   */
  async log(params: ActivityLogParams) {
    // DODATA ROBUSTNA PROVERA: Da li je 'params' objekat validan?
    if (!params || typeof params !== 'object') {
      console.error("[ActivityLogService] log called with invalid or missing parameters. Received:", params);
      return; // Prekini izvršavanje ako parametri nisu validni
    }

    // Destrukturiranje parametara. userId je sada obavezan i ne može biti undefined ovde.
    const { action, entityType, entityId, details, severity = LogSeverity.INFO, userId } = params;

    // DODATA ROBUSTNA PROVERA: Da li je 'userId' definisan?
    // Ova provera je sada redundantna ako TypeScript enforce-uje ActivityLogParams,
    // ali je dobra defanzivna mera za runtime greške ili ako se tipovi ne podudaraju.
    if (!userId) {
        console.error("[ActivityLogService] log called with missing userId in parameters. Full params:", params);
        return; // Prekini izvršavanje ako userId nedostaje
    }

    try {
      // Koristi tvoju 'db' instancu Prisma klijenta za kreiranje zapisa
      return await db.activityLog.create({
        data: {
          action,
          entityType,
          entityId,
          details,
          severity,
          userId, // userId će biti non-nullable jer je sada obavezan parametar
          createdAt: new Date(), // Dodaj createdAt polje, pretpostavljajući da postoji
        }
      });
    } catch (error) {
      // Logovanje greške ako upis u bazu ne uspe
      console.error(`ActivityLogService: Failed to create log entry for action "${action}":`, error);
      // Ovde ne bi trebalo bacati grešku dalje u aplikaciju, jer ne želimo da logovanje obori glavnu akciju.
    }
  }
};
