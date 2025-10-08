# 🏛️ TRES - Arhitektura Sistema

## 📐 Pregled Arhitekture

TRES je moderna full-stack aplikacija bazirana na **Next.js 15 App Router** arhitekturi sa serverskim komponentama, API rutama i serverskim akcijama.

---

## 🎯 Arhitekturni Principi

1. **Separation of Concerns** - Jasna podela između frontend, backend i baze
2. **Server-First** - Korišćenje Server Components gde god je moguće
3. **Type Safety** - Kompletna TypeScript pokrivenost
4. **Progressive Enhancement** - Funkcioniše i bez JavaScript-a (gde je moguće)
5. **Security by Design** - Bezbednost ugrađena od početka

---

## 🗂️ Slojevita Arhitektura

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│    (React Components, UI, Forms)        │
└─────────────────────────────────────────┘
                  ↕
┌─────────────────────────────────────────┐
│         Application Layer               │
│   (Server Actions, API Routes)          │
└─────────────────────────────────────────┘
                  ↕
┌─────────────────────────────────────────┐
│         Business Logic Layer            │
│   (Services, Validators, Utils)         │
└─────────────────────────────────────────┘
                  ↕
┌─────────────────────────────────────────┐
│         Data Access Layer               │
│        (Prisma ORM, Database)           │
└─────────────────────────────────────────┘
                  ↕
┌─────────────────────────────────────────┐
│         Data Storage Layer              │
│      (PostgreSQL Database)              │
└─────────────────────────────────────────┘
```

---

## 🧩 Komponente Sistema

### 1. **Frontend Layer**

```
app/(protected)/
├── contracts/
│   ├── page.tsx                 # Server Component (lista)
│   ├── [id]/
│   │   └── page.tsx             # Server Component (detalji)
│   └── new/
│       └── page.tsx             # Client Component (forma)
│
components/
├── ui/                          # shadcn/ui komponente
│   ├── button.tsx
│   ├── dialog.tsx
│   └── table.tsx
├── contracts/
│   ├── ContractForm.tsx         # 'use client'
│   ├── ContractList.tsx         # 'use client'
│   └── ContractCard.tsx         # Server Component
└── providers/
    └── SessionProvider.tsx      # Context Provider
```

**Karakteristike:**
- **Server Components** za statički content i SEO
- **Client Components** za interaktivnost (forme, modali)
- **Streaming** za brže učitavanje velikih tabela
- **Suspense boundaries** za loading states

---

### 2. **API Layer**

#### A. **API Routes** (`app/api/`)

```typescript
// app/api/contracts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const contracts = await db.contract.findMany({
    where: { status: 'ACTIVE' },
    include: { provider: true }
  });

  return NextResponse.json(contracts);
}

export async function POST(request: NextRequest) {
  // Create contract logic
}
```

**Koristi se za:**
- ✅ External webhooks
- ✅ Public API endpoints
- ✅ File uploads
- ✅ Third-party integracije

---

#### B. **Server Actions** (`actions/`)

```typescript
// actions/contracts/create.ts
'use server'

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function createContract(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, message: 'Not authenticated' };
  }

  const contract = await db.contract.create({
    data: {
      // ... contract data
      createdById: session.user.id
    }
  });

  revalidatePath('/contracts');
  return { success: true, contract };
}
```

**Koristi se za:**
- ✅ Forme i mutations
- ✅ Data revalidation
- ✅ Progressively enhanced actions
- ✅ Direct DB access bez API overhead-a

---

### 3. **Business Logic Layer**

```
lib/
├── contracts/
│   ├── validators.ts           # Zod sheme
│   ├── expiration-checker.ts   # Business logika
│   └── renewal-workflow.ts     # Workflow management
├── notifications/
│   ├── email-sender.ts
│   └── reminder-scheduler.ts
└── security/
    ├── permissions.ts
    └── rate-limiter.ts
```

**Primer - Validator:**

```typescript
// lib/contracts/validators.ts
import { z } from 'zod';

export const contractSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  contractNumber: z.string().regex(/^CNT-\d{4}$/),
  startDate: z.date(),
  endDate: z.date(),
  revenuePercentage: z.number().min(0).max(100),
}).refine(data => data.endDate > data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate']
});
```

**Primer - Business Logic:**

```typescript
// lib/contracts/expiration-checker.ts
export async function checkExpiringContracts() {
  const sixtyDaysFromNow = new Date();
  sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

  const expiringContracts = await db.contract.findMany({
    where: {
      status: 'ACTIVE',
      endDate: {
        lte: sixtyDaysFromNow,
        gte: new Date()
      }
    }
  });

  // Pošalji notifikacije
  for (const contract of expiringContracts) {
    await sendExpirationReminder(contract);
  }
}
```

---

### 4. **Data Access Layer (Prisma ORM)**

```typescript
// lib/db.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error']
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
```

**Optimizacije:**
- Connection pooling
- Query logging u dev modu
- Singleton pattern za proizvodnju
- Prepared statements (automatski)

---

## 🔐 Autentifikacija i Autorizacija

### NextAuth.js v5 Flow

```typescript
// auth.ts
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const { auth, signIn, signOut, handlers } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {}
      },
      async authorize(credentials) {
        const user = await db.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        return isValid ? user : null;
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/auth/login'
  }
});
```

### Middleware za Zaštitu Ruta

```typescript
// middleware.ts
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith('/auth');
  const isProtectedPage = req.nextUrl.pathname.startsWith('/contracts');

  if (isProtectedPage && !isLoggedIn) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};
```

---

## 📊 Data Flow Patterns

### Pattern 1: Server Component → Database

```typescript
// app/(protected)/contracts/page.tsx
import { db } from '@/lib/db';
import { ContractList } from '@/components/contracts/ContractList';

export default async function ContractsPage() {
  // Direktan pristup bazi u Server Component
  const contracts = await db.contract.findMany({
    include: { provider: true }
  });

  return <ContractList contracts={contracts} />;
}
```

**Prednosti:**
- ✅ Nema waterfall requests
- ✅ Bolji SEO
- ✅ Brže učitavanje
- ✅ Manje bundle size-a

---

### Pattern 2: Client Component → Server Action → Database

```typescript
// components/contracts/ContractForm.tsx
'use client'

import { createContract } from '@/actions/contracts/create';

export function ContractForm() {
  async function handleSubmit(formData: FormData) {
    const result = await createContract(formData);
    
    if (result.success) {
      toast.success('Contract created!');
    }
  }

  return <form action={handleSubmit}>...</form>;
}
```

**Prednosti:**
- ✅ Type-safe
- ✅ Nema potrebe za API endpoint
- ✅ Progressive enhancement
- ✅ Automatska revalidacija

---

### Pattern 3: Client Component → API Route → Database

```typescript
// components/contracts/ContractUploader.tsx
'use client'

export function ContractUploader() {
  async function uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/contracts/upload', {
      method: 'POST',
      body: formData
    });

    return response.json();
  }
}
```

**Koristi se za:**
- ✅ File uploads
- ✅ External webhooks
- ✅ Long-running operacije

---

## 🔄 Caching Strategy

### 1. **Next.js Cache Layers**

```typescript
// Force dynamic (no cache)
export const dynamic = 'force-dynamic';

// Revalidate every hour
export const revalidate = 3600;

// Manual revalidation
import { revalidatePath } from 'next/cache';
revalidatePath('/contracts');
```

### 2. **Prisma Query Caching**

```typescript
// Caching na nivou upita
const contracts = await db.contract.findMany({
  where: { status: 'ACTIVE' },
  cacheStrategy: { ttl: 60 } // 60 sekundi
});
```

### 3. **Redis Cache** (opciono)

```typescript
// lib/cache.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!
});

export async function getCachedContracts() {
  const cached = await redis.get('contracts:active');
  
  if (cached) return cached;
  
  const contracts = await db.contract.findMany({
    where: { status: 'ACTIVE' }
  });
  
  await redis.setex('contracts:active', 300, JSON.stringify(contracts));
  return contracts;
}
```

---

## 🚀 Performance Optimizations

### 1. **Database Indexes**

```prisma
model Contract {
  // ...
  @@index([status])
  @@index([endDate])
  @@index([providerId])
  @@index([status, endDate]) // Composite index
}
```

### 2. **Query Optimization**

```typescript
// ❌ N+1 problem
const contracts = await db.contract.findMany();
for (const contract of contracts) {
  const provider = await db.provider.findUnique({
    where: { id: contract.providerId }
  });
}

// ✅ Jedan upit sa include
const contracts = await db.contract.findMany({
  include: { provider: true }
});
```

### 3. **Streaming & Suspense**

```typescript
// app/contracts/page.tsx
import { Suspense } from 'react';

export default function Page() {
  return (
    <Suspense fallback={<ContractsSkeleton />}>
      <ContractsList />
    </Suspense>
  );
}
```

---

## 🛡️ Security Architecture

### 1. **Input Validation**

```typescript
// Svaki input mora biti validiran
const validated = contractSchema.safeParse(input);
if (!validated.success) {
  throw new Error('Invalid input');
}
```

### 2. **SQL Injection Prevention**

```typescript
// ✅ Prisma automatski escape-uje upite
await db.contract.findMany({
  where: { name: userInput } // Bezbedno
});

// ❌ NIKAD raw SQL bez parametara
await db.$queryRaw(`SELECT * FROM contracts WHERE name = '${userInput}'`);

// ✅ Raw SQL sa parametrima
await db.$queryRaw`SELECT * FROM contracts WHERE name = ${userInput}`;
```

### 3. **CSRF Protection**

```typescript
// NextAuth automatski dodaje CSRF tokene
// Server Actions imaju ugrađenu CSRF zaštitu
```

### 4. **Rate Limiting**

```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

export async function middleware(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return new Response('Too Many Requests', { status: 429 });
  }
}
```

### 5. **Authorization Checks**

```typescript
// lib/auth/permissions.ts
export async function canEditContract(userId: string, contractId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });

  if (user?.role === 'ADMIN') return true;

  const contract = await db.contract.findUnique({
    where: { id: contractId },
    select: { createdById: true }
  });

  return contract?.createdById === userId;
}
```

---

## 📦 File Upload Architecture

### Upload Flow

```
Client                Server Action              Storage
  │                        │                        │
  │──── Upload File ──────>│                        │
  │                        │                        │
  │                        │── Validate ────────────│
  │                        │   (size, type)         │
  │                        │                        │
  │                        │── Save to Disk ───────>│
  │                        │   /public/uploads/     │
  │                        │                        │
  │                        │── Create DB Record ────│
  │                        │   (metadata)           │
  │                        │                        │
  │<──── Success/Error ────│                        │
```

### Implementation

```typescript
// actions/contracts/upload-attachment.ts
'use server'

import { writeFile } from 'fs/promises';
import { join } from 'path';
import { auth } from '@/auth';
import { db } from '@/lib/db';

const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function uploadContractAttachment(
  contractId: string,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, message: 'Not authenticated' };
  }

  const file = formData.get('file') as File;

  // Validacija
  if (!file) {
    return { success: false, message: 'No file provided' };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, message: 'Invalid file type' };
  }

  if (file.size > MAX_SIZE) {
    return { success: false, message: 'File too large' };
  }

  // Sačuvaj fajl
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const fileName = `${Date.now()}-${file.name}`;
  const uploadDir = join(process.cwd(), 'public', 'uploads', 'contracts');
  const filePath = join(uploadDir, fileName);

  await writeFile(filePath, buffer);

  // Kreiraj DB record
  const attachment = await db.contractAttachment.create({
    data: {
      contractId,
      fileName: file.name,
      filePath: `/uploads/contracts/${fileName}`,
      fileSize: file.size,
      fileType: file.type,
      uploadedById: session.user.id
    }
  });

  return { success: true, attachment };
}
```

---

## 📧 Email & Notification System

### Architecture

```
Trigger Event          Queue System           Email Service
     │                      │                       │
     │── Contract Expires ──>│                      │
     │                      │                       │
     │                      │── Process Queue ─────>│
     │                      │   (Resend API)        │
     │                      │                       │
     │                      │<──── Sent ────────────│
     │                      │                       │
     │                      │── Update DB ──────────│
     │                      │   (sent status)       │
```

### Implementation

```typescript
// lib/notifications/email-sender.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendContractExpirationEmail(contract: Contract) {
  try {
    await resend.emails.send({
      from: 'TRES System <noreply@tres-system.com>',
      to: contract.createdBy.email,
      subject: `Contract Expiring Soon: ${contract.name}`,
      html: `
        <h2>Contract Expiration Notice</h2>
        <p>The following contract is expiring soon:</p>
        <ul>
          <li><strong>Name:</strong> ${contract.name}</li>
          <li><strong>Contract Number:</strong> ${contract.contractNumber}</li>
          <li><strong>End Date:</strong> ${contract.endDate.toLocaleDateString()}</li>
        </ul>
        <p>Please initiate the renewal process.</p>
      `
    });

    // Log notifikacije
    await db.contractReminder.create({
      data: {
        contractId: contract.id,
        type: 'EMAIL',
        sentAt: new Date(),
        status: 'SENT'
      }
    });

  } catch (error) {
    console.error('Failed to send email:', error);
    
    await db.contractReminder.create({
      data: {
        contractId: contract.id,
        type: 'EMAIL',
        sentAt: new Date(),
        status: 'FAILED',
        errorMessage: error.message
      }
    });
  }
}
```

### Cron Job Setup

```typescript
// app/api/cron/check-expirations/route.ts
import { NextResponse } from 'next/server';
import { checkExpiringContracts } from '@/lib/contracts/expiration-checker';

export async function GET(request: Request) {
  // Verifikuj Vercel Cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await checkExpiringContracts();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

**Vercel Cron Config:**

```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/check-expirations",
    "schedule": "0 9 * * *"
  }]
}
```

---

## 🤖 AI Integration (MCP)

### MCP Server Architecture

```
Email Client          MCP Server              TRES Database
     │                     │                        │
     │── New Email ───────>│                        │
     │                     │                        │
     │                     │── Parse Email ─────────│
     │                     │   (OpenAI)             │
     │                     │                        │
     │                     │── Extract Data ────────│
     │                     │   - Price              │
     │                     │   - Service Name       │
     │                     │   - Provider           │
     │                     │                        │
     │                     │── Save to DB ─────────>│
     │                     │                        │
     │<──── Confirmation ──│                        │
```

### Implementation

```typescript
// lib/mcp/handleAIQuery.ts
import OpenAI from 'openai';
import { db } from '@/lib/db';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function processEmailWithAI(emailContent: string) {
  const prompt = `
    Analiziraj sledeći email i izvuci strukturovane podatke:
    
    Email:
    ${emailContent}
    
    Izvuci sledeće podatke u JSON formatu:
    - serviceName: string
    - provider: string
    - price: number
    - contractNumber: string
    - startDate: ISO date string
    - endDate: ISO date string
  `;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'You are a contract data extraction assistant.' },
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' }
  });

  const extractedData = JSON.parse(response.choices[0].message.content);

  // Validacija sa Zod
  const validated = contractSchema.safeParse(extractedData);
  
  if (!validated.success) {
    throw new Error('Invalid extracted data');
  }

  // Kreiraj draft ugovor
  const contract = await db.contract.create({
    data: {
      ...validated.data,
      status: 'DRAFT',
      source: 'AI_EXTRACTED'
    }
  });

  return contract;
}
```

---

## 📊 Reporting Architecture

### Report Generation Flow

```
User Request          Server Action          Report Generator
     │                     │                        │
     │── Generate Report ──>│                        │
     │                     │                        │
     │                     │── Fetch Data ──────────│
     │                     │   (Prisma)             │
     │                     │                        │
     │                     │── Format Data ────────>│
     │                     │   (ExcelJS/PDF)        │
     │                     │                        │
     │                     │<──── File ─────────────│
     │                     │   /public/reports/     │
     │                     │                        │
     │<──── Download Link ─│                        │
```

### Implementation

```typescript
// lib/reports/report-generator.ts
import ExcelJS from 'exceljs';
import { db } from '@/lib/db';

export async function generateContractReport(filters: ReportFilters) {
  // Fetch data
  const contracts = await db.contract.findMany({
    where: {
      status: filters.status,
      providerId: filters.providerId,
      endDate: {
        gte: filters.startDate,
        lte: filters.endDate
      }
    },
    include: {
      provider: true,
      createdBy: true
    }
  });

  // Create Excel workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Contracts Report');

  // Add headers
  worksheet.columns = [
    { header: 'Contract Number', key: 'contractNumber', width: 20 },
    { header: 'Name', key: 'name', width: 30 },
    { header: 'Provider', key: 'provider', width: 20 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Start Date', key: 'startDate', width: 15 },
    { header: 'End Date', key: 'endDate', width: 15 },
    { header: 'Revenue %', key: 'revenue', width: 12 }
  ];

  // Style headers
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };

  // Add data
  contracts.forEach(contract => {
    worksheet.addRow({
      contractNumber: contract.contractNumber,
      name: contract.name,
      provider: contract.provider?.name || 'N/A',
      status: contract.status,
      startDate: contract.startDate.toLocaleDateString(),
      endDate: contract.endDate.toLocaleDateString(),
      revenue: contract.revenuePercentage?.toString() || '0'
    });
  });

  // Add summary
  const summaryRow = worksheet.addRow([]);
  summaryRow.getCell(1).value = 'Total Contracts:';
  summaryRow.getCell(2).value = contracts.length;
  summaryRow.font = { bold: true };

  // Save file
  const fileName = `contracts-report-${Date.now()}.xlsx`;
  const filePath = `public/reports/${fileName}`;
  
  await workbook.xlsx.writeFile(filePath);

  return {
    fileName,
    filePath: `/reports/${fileName}`,
    recordCount: contracts.length
  };
}
```

---

## 🧪 Testing Strategy

### 1. **Unit Tests**

```typescript
// __tests__/lib/validators.test.ts
import { contractSchema } from '@/lib/contracts/validators';

describe('Contract Validator', () => {
  it('should validate correct contract data', () => {
    const validData = {
      name: 'Test Contract',
      contractNumber: 'CNT-2024',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-01-01'),
      revenuePercentage: 15
    };

    const result = contractSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject invalid end date', () => {
    const invalidData = {
      name: 'Test Contract',
      contractNumber: 'CNT-2024',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2024-01-01'), // Before start date
      revenuePercentage: 15
    };

    const result = contractSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
```

### 2. **Integration Tests**

```typescript
// __tests__/actions/create-contract.test.ts
import { createContract } from '@/actions/contracts/create';
import { db } from '@/lib/db';

jest.mock('@/auth', () => ({
  auth: () => Promise.resolve({
    user: { id: 'test-user-id', email: 'test@example.com' }
  })
}));

describe('Create Contract Action', () => {
  it('should create a contract successfully', async () => {
    const formData = new FormData();
    formData.append('name', 'Test Contract');
    formData.append('contractNumber', 'CNT-2024');
    // ... other fields

    const result = await createContract(formData);

    expect(result.success).toBe(true);
    expect(result.contract).toBeDefined();

    // Cleanup
    await db.contract.delete({
      where: { id: result.contract.id }
    });
  });
});
```

---

## 🚀 Deployment Architecture

### Vercel Deployment

```
┌─────────────────────────────────────────┐
│         Vercel Edge Network             │
│           (CDN + Caching)               │
└─────────────────────────────────────────┘
                  ↕
┌─────────────────────────────────────────┐
│       Next.js Application               │
│    (Serverless Functions)               │
└─────────────────────────────────────────┘
                  ↕
┌─────────────────────────────────────────┐
│     Supabase PostgreSQL Database        │
│       (Connection Pooling)              │
└─────────────────────────────────────────┘
```

### Environment Variables

```bash
# .env.production
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

NEXTAUTH_URL="https://tres.your-domain.com"
NEXTAUTH_SECRET="your-secret-key"

RESEND_API_KEY="re_..."
OPENAI_API_KEY="sk-..."

UPSTASH_REDIS_URL="https://..."
UPSTASH_REDIS_TOKEN="..."

CRON_SECRET="your-cron-secret"
```

---

## 📈 Monitoring & Logging

### 1. **Application Logging**

```typescript
// lib/logger.ts
export const logger = {
  info: (message: string, meta?: any) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      meta,
      timestamp: new Date().toISOString()
    }));
  },
  
  error: (message: string, error?: Error) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error?.message,
      stack: error?.stack,
      timestamp: new Date().toISOString()
    }));
  }
};
```

### 2. **Performance Monitoring**

```typescript
// lib/metrics.ts
export async function trackQueryPerformance<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  
  try {
    const result = await queryFn();
    const duration = Date.now() - start;
    
    logger.info(`Query: ${queryName}`, { duration });
    
    return result;
  } catch (error) {
    logger.error(`Query failed: ${queryName}`, error);
    throw error;
  }
}

// Usage
const contracts = await trackQueryPerformance(
  'fetch-active-contracts',
  () => db.contract.findMany({ where: { status: 'ACTIVE' } })
);
```

---

## 🎯 Best Practices Summary

1. ✅ **Koristi Server Components kao default**
2. ✅ **Client Components samo kada je potrebna interaktivnost**
3. ✅ **Server Actions za forme i mutations**
4. ✅ **API Routes za eksterne integracije**
5. ✅ **Validiraj sve inpute sa Zod**
6. ✅ **Uvek proveri autentifikaciju i autorizaciju**
7. ✅ **Indeksiraj često korišćene kolone**
8. ✅ **Koristi Prisma include umesto N+1 upita**
9. ✅ **Implementiraj proper error handling**
10. ✅ **Log sve važne akcije**

---

**Poslednje ažuriranje:** Januar 2025  
**Next.js verzija:** 15.3.3  
**Arhitektura:** App Router + Server Components