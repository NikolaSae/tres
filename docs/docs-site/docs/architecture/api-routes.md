---
id: api-routes
title: API Routes
sidebar_label: 🔌 API Routes
---

# API Routes

TRES ima kompletnu REST API strukturu u `app/api/`.

## Konvencije

Svi API endpoint-i prate Next.js App Router konvenciju:

```
app/api/
  {resource}/
    route.ts          → GET (lista), POST (kreiranje)
    [id]/
      route.ts        → GET (detalji), PUT (update), DELETE
```

## Autentifikacija API-ja

Svi zaštićeni endpoint-i proveravaju session:

```typescript
import { getServerSession } from "@/lib/session";

export async function GET() {
  const session = await getServerSession();
  if (!session) return new Response("Unauthorized", { status: 401 });
  ...
}
```

## Kompletna lista endpoint-a

### Auth
```
POST /api/auth/[...nextauth]   — NextAuth handler
```

### Contracts
```
GET    /api/contracts              — Lista ugovora
POST   /api/contracts              — Novi ugovor
GET    /api/contracts/[id]         — Detalji
PUT    /api/contracts/[id]         — Update
DELETE /api/contracts/[id]         — Brisanje
GET    /api/contracts/expiring     — Ugovori koji ističu
GET    /api/contracts/statistics   — Statistike
GET    /api/contracts/timeline     — Timeline za grafikon
POST   /api/contracts/export       — Export
POST   /api/contracts/[id]/attachments — Upload attachment-a
```

### Providers
```
GET    /api/providers              — Lista
POST   /api/providers              — Novi
GET    /api/providers/[id]         — Detalji
PUT    /api/providers/[id]         — Update
POST   /api/providers/vas-import   — Import VAS podataka
POST   /api/providers/upload       — Upload logo
GET    /api/providers/by-name      — Pretraga po imenu
```

### Complaints
```
GET    /api/complaints             — Lista
POST   /api/complaints             — Novi prigovor
GET    /api/complaints/[id]        — Detalji
PUT    /api/complaints/[id]        — Update
GET    /api/complaints/statistics  — Statistike
GET    /api/complaints/export      — Export
```

### Humanitarian
```
GET    /api/humanitarian-orgs             — Lista
POST   /api/humanitarian-orgs             — Nova org.
GET    /api/humanitarian-orgs/[id]        — Detalji
PUT    /api/humanitarian-orgs/[id]        — Update
GET    /api/humanitarian-renewals         — Lista obnova
POST   /api/humanitarian-renewals         — Nova obnova
GET    /api/humanitarian-renewals/statistics — Statistike
GET    /api/organizations/by-kratki-broj  — Lookup po kratkom broju
```

### Parking
```
GET    /api/parking-services              — Lista
POST   /api/parking-services             — Novi
GET    /api/parking-services/[id]         — Detalji
POST   /api/parking-services/[id]/upload  — Upload podataka
GET    /api/parking-services/[id]/reports — Izveštaji
POST   /api/parking-services/typescript-import         — Import
POST   /api/parking-services/typescript-import-stream  — Streaming import
POST   /api/parking-services/rename-file  — Preimennovanje
GET    /api/parking-services/activity     — Activity log
```

### Services & Operators
```
GET    /api/services               — Lista usluga
POST   /api/services               — Nova usluga
GET    /api/services/categories    — Kategorije
POST   /api/services/import        — Import
GET    /api/bulk-services          — Bulk kampanje
POST   /api/bulk-services/import   — Import bulk
GET    /api/operators              — Lista operatora
POST   /api/operators              — Novi operator
```

### Analytics
```
GET    /api/analytics/financials   — Finansijski podaci
GET    /api/analytics/sales        — Sales podaci
```

### Reports
```
POST   /api/reports/generate           — Generiši izveštaj
GET    /api/reports/scan-unified       — Skeniranje
POST   /api/reports/upload-humanitarian — Upload humanitarian
POST   /api/reports/upload-parking     — Upload parking
POST   /api/reports/upload-provider    — Upload provider
GET    /api/reports/validate-system    — Validacija
```

### Notifications
```
GET    /api/notifications              — Lista
PUT    /api/notifications              — Označi kao pročitano
POST   /api/notifications/email        — Pošalji email
POST   /api/notifications/push         — Push
```

### Security & Admin
```
GET    /api/security/logs          — Security logovi
GET    /api/security/performance   — Performance metrike
GET    /api/security/permissions   — Provera permisija
GET    /api/users                  — Lista korisnika (admin)
POST   /api/admin/mcp              — MCP proxy
```

### Cron
```
POST   /api/cron/check-expiring    — Provera isteka ugovora
```

## Error handling

Standardni HTTP status kodovi:

| Kod | Opis |
|-----|------|
| 200 | Uspešno |
| 201 | Kreiran |
| 400 | Bad Request — validaciona greška |
| 401 | Unauthorized — nije ulogovan |
| 403 | Forbidden — nema dozvolu |
| 404 | Not Found |
| 500 | Server Error |