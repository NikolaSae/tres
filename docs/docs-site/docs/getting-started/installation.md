---
id: installation
title: Instalacija
sidebar_label: Instalacija
---

# Instalacija

## Preduslovi

Pre nego što počneš, proveri da imaš:

- **Node.js** v18+ (`node --version`)
- **npm** v9+ ili **yarn**
- **PostgreSQL** baza (lokalno ili Supabase)
- **Git**

## Kloniranje repozitorijuma

```bash
git clone https://github.com/NikolaSae/tres.git
cd tres
```

## Instalacija zavisnosti

```bash
npm install
```

## Postavljanje environment varijabli

Kopiraj primer `.env` fajla i popuni vrednosti:

```bash
cp .env-te .env
```

Otvori `.env` i popuni sledeće varijable:

```env
# Baza podataka (Supabase ili lokalni PostgreSQL)
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"
DIRECT_URL="postgresql://user:password@host:5432/dbname"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generisi-random-string-ovde"

# Email (Resend)
RESEND_API_KEY="re_..."

# AI (OpenAI)
OPENAI_API_KEY="sk-..."

# Cache (Upstash Redis) — opciono
UPSTASH_REDIS_URL="https://..."
UPSTASH_REDIS_TOKEN="..."

# Cron zaštita
CRON_SECRET="random-secret-za-cron-jobove"
```

:::tip Generisanje NEXTAUTH_SECRET
Pokreni u terminalu:
```bash
openssl rand -base64 32
```
:::

## Postavljanje baze podataka

```bash
# Generiši Prisma client
npx prisma generate

# Pokreni migracije
npx prisma migrate dev

# (Opciono) Seed sa test podacima
npm run seed
```

## Pokretanje razvojnog servera

```bash
npm run dev
```

Aplikacija je dostupna na `http://localhost:3000`.

## Provera instalacije

Nakon pokretanja, trebalo bi da vidiš login stranicu. Default kredencijali (nakon seed-a):

| Rola | Email | Lozinka |
|------|-------|---------|
| Admin | admin@example.com | admin123 |
| Korisnik | user@example.com | user123 |

:::warning
Promeni default lozinke pre deployovanja u produkciju!
:::