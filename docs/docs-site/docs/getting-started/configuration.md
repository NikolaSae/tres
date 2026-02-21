---
id: configuration
title: Konfiguracija
sidebar_label: Konfiguracija
---

# Konfiguracija

## Prisma & Baza podataka

### Šema

Prisma šema se nalazi u `prisma/schema.prisma`. Nakon svake izmene šeme:

```bash
npx prisma migrate dev --name naziv_migracije
npx prisma generate
```

### Prisma Studio

Grafički interfejs za pregled i uređivanje podataka u bazi:

```bash
npx prisma studio
```

Otvara se na `http://localhost:5555`.

## NextAuth konfiguracija

Autentifikacija je konfigurisana u `auth.config.ts` i `auth.ts`.

Podržani provajderi:
- **Credentials** — email + lozinka sa bcrypt hash-om
- **Two-Factor Authentication** — TOTP kod

Rute zaštite su definisane u `routes.ts`:

```typescript
// routes.ts
export const publicRoutes = ["/", "/auth/new-verification"];
export const authRoutes = ["/auth/login", "/auth/register", ...];
export const apiAuthPrefix = "/api/auth";
export const DEFAULT_LOGIN_REDIRECT = "/dashboard";
```

## Redis Cache

TRES koristi Upstash Redis za keširanje čestih upita. Konfiguracija u `lib/cache/`:

```typescript
// lib/cache/config.ts
export const CACHE_TTL = {
  SHORT: 60,        // 1 minut
  MEDIUM: 300,      // 5 minuta
  LONG: 3600,       // 1 sat
  DAY: 86400,       // 1 dan
};
```

Ako Redis nije konfigurisan, aplikacija koristi in-memory cache kao fallback.

## Email konfiguracija

TRES podržava dva email provajdera:

**Resend** (preporučeno za produkciju):
```env
RESEND_API_KEY="re_..."
```

**Outlook/SMTP** (za lokalni razvoj):
```env
OUTLOOK_SMTP_HOST="smtp.office365.com"
OUTLOOK_SMTP_PORT="587"
OUTLOOK_SMTP_USER="email@firma.rs"
OUTLOOK_SMTP_PASS="lozinka"
```

## Cron Jobs

Automatski cron jobovi za proveru isteka ugovora. Konfigurišu se u `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-expiring",
      "schedule": "0 9 * * *"
    }
  ]
}
```

Cron je zaštićen sa `CRON_SECRET` environment varijablom.

## AI / MCP konfiguracija

Model Context Protocol server se pokreće odvojeno:

```bash
cd mcp-server
npm install
npm run dev
```

MCP server omogućava AI agentu da čita i piše podatke direktno u bazu putem prirodnog jezika.