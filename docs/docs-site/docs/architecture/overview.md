---
id: overview
title: Pregled Arhitekture
sidebar_label: 🏗️ Pregled
---

# Pregled Arhitekture

TRES je izgrađen na **Next.js 15 App Router** arhitekturi sa kombinacijom Server Actions i REST API Routes.

## Visoki nivo

```
Browser (React 19)
    ↕ (RSC / Client Components)
Next.js App Router
    ├── Server Actions  → Direktan DB pristup (bez HTTP overhead)
    └── API Routes      → REST API za klijentske hook-ove
        ↕
    Prisma ORM
        ↕
    PostgreSQL (Supabase)
        ↕ (cache layer)
    Upstash Redis
```

## Slojevi aplikacije

### 1. Prezentacioni sloj (`app/`, `components/`)

- **Server Components** — renderuju se na serveru, direktan DB pristup
- **Client Components** — interaktivni UI, koriste hook-ove
- **Layouts** — `app/(protected)/layout.tsx` — shared navbar, sidebar

### 2. Akcije sloj (`actions/`)

Server Actions su direktne TypeScript funkcije koje se izvršavaju na serveru:

```typescript
"use server";
// actions/contracts/create.ts
export async function createContract(data: ContractFormValues) {
  const session = await getServerSession();
  await db.contract.create({ data });
  revalidatePath("/contracts");
}
```

### 3. API sloj (`app/api/`)

REST API endpoints za hook-ove i externe integracije:

```
GET  /api/contracts       → lista ugovora
POST /api/contracts       → kreiranje
GET  /api/contracts/[id]  → detalji
```

### 4. Podatkovni sloj (`lib/`, `data/`)

- `lib/db.ts` — Prisma client singleton
- `lib/cache/` — Redis cache wrapper
- `data/` — data access funkcije

### 5. Šeme i validacija (`schemas/`)

Zod šeme za validaciju svih formi i API inputa:

```typescript
// schemas/contract.ts
export const ContractSchema = z.object({
  title: z.string().min(1),
  startDate: z.date(),
  endDate: z.date(),
  ...
});
```

## Rendering strategija

| Tip stranice | Rendering | Razlog |
|---|---|---|
| Lista entiteta | Server Component | SEO, brzo inicijalno učitavanje |
| Detalji entiteta | Server Component | Direktan DB pristup |
| Forme | Client Component | Interaktivnost, validacija |
| Grafikovi (charts) | Client Component | Recharts zahteva browser |
| Dashboard | Hybrid | Mix server data + client interakcija |

## Data fetching

```typescript
// U Server Component-u — direktan DB
const contracts = await db.contract.findMany();

// U Client Component-u — putem custom hook-a
const { contracts, isLoading } = useContracts();

// Hook interno koristi SWR / fetch
// hooks/use-contracts.ts → GET /api/contracts
```

## Caching strategija

1. **Redis** — API odgovori, učestali DB upiti (TTL: 5 minuta)
2. **Next.js Cache** — Static assets, API route caching
3. **revalidatePath/revalidateTag** — Invalidacija cache-a nakon mutacija