---
id: folder-structure
title: Struktura Foldera
sidebar_label: 📁 Folder Struktura
---

# Struktura Foldera

```
tres/
├── actions/          # Server Actions (server-side logika)
│   ├── contracts/    # CRUD za ugovore
│   ├── complaints/   # CRUD za prigovore
│   ├── providers/    # CRUD za provajdere
│   ├── parking-services/
│   ├── humanitarian-orgs/
│   ├── humanitarian-renewals/
│   ├── bulk-services/
│   ├── services/
│   ├── operators/
│   ├── reports/
│   ├── analytics/
│   ├── blacklist/
│   ├── notifications/
│   ├── security/
│   ├── users/
│   └── log/
│
├── app/              # Next.js App Router
│   ├── (protected)/  # Zaštićene rute (zahtevaju login)
│   │   ├── contracts/
│   │   ├── providers/
│   │   ├── humanitarian-orgs/
│   │   ├── parking-services/
│   │   ├── services/
│   │   ├── complaints/
│   │   ├── reports/
│   │   ├── analytics/
│   │   ├── notifications/
│   │   ├── chat/
│   │   ├── dashboard/
│   │   ├── admin/
│   │   └── audit-logs/
│   ├── api/          # REST API endpoints
│   └── auth/         # Login, Register, Reset stranice
│
├── components/       # React komponente
│   ├── ui/           # Bazne UI komponente (shadcn/ui)
│   ├── contracts/
│   ├── providers/
│   ├── complaints/
│   ├── parking-services/
│   ├── humanitarian-orgs/
│   ├── reports/
│   ├── analytics/
│   ├── security/
│   ├── auth/
│   └── notifications/
│
├── hooks/            # Custom React hook-ovi
│   ├── use-contracts.ts
│   ├── use-providers.ts
│   ├── use-complaints.ts
│   └── ...
│
├── lib/              # Utilities i core logika
│   ├── auth/         # Auth helpers
│   ├── cache/        # Redis cache
│   ├── contracts/    # Poslovni procesi za ugovore
│   ├── notifications/ # Email i push notifikacije
│   ├── reports/      # Excel generisanje
│   ├── security/     # Audit, permissions, rate limiting
│   ├── mcp/          # AI / MCP integracija
│   ├── email/        # Email provajderi
│   ├── types/        # TypeScript tipovi
│   ├── db.ts         # Prisma client
│   ├── auth.ts       # NextAuth konfiguracija
│   └── utils.ts      # Generalni utils
│
├── schemas/          # Zod validacione šeme
│
├── prisma/           # Baza podataka
│   ├── schema.prisma # Šema
│   ├── migrations/   # Istorija migracija
│   └── seed.ts       # Seed podaci
│
├── mcp-server/       # Standalone MCP server
│
├── public/           # Statički fajlovi
│   ├── reports/      # Generisani izveštaji (humanitarian)
│   ├── parking-service/ # Parking izveštaji
│   └── providers/    # Provider izveštaji
│
├── scripts/          # Python i JS skripte
│   ├── email_processor.py
│   ├── parking_service_processor.py
│   └── vas_provider_processor.py
│
├── utils/            # Pomoćne funkcije
└── types/            # Globalni TypeScript tipovi
```

## Konvencije imenovanja

- **Server Actions** — glagol u infinitivu: `createContract.ts`, `deleteProvider.ts`
- **API Routes** — REST princip: `route.ts` u odgovarajućem folderu
- **Komponente** — PascalCase: `ContractList.tsx`, `ProviderCard.tsx`
- **Hook-ovi** — `use-` prefix: `use-contracts.ts`
- **Šeme** — po entitetu: `contract.ts`, `provider.ts`

## Gde šta staviti?

| Tip koda | Lokacija |
|----------|----------|
| Poslovni procesi | `actions/` ili `lib/` |
| API pozivi | `app/api/` |
| UI komponente | `components/` |
| Podaci iz baze (hook) | `hooks/` → `app/api/` → `actions/` |
| Email logika | `lib/notifications/` ili `lib/email/` |
| Validacija formi | `schemas/` |
| TypeScript tipovi | `lib/types/` ili `types/` |