# 📚 TRES - Telco Regulation & Expense System

## 🎯 Executive Summary

**TRES** je sveobuhvatna Next.js aplikacija za upravljanje telekomunikacionim uslugama, humanitarnim organizacijama, parking servisima i provider ugovorima. Sistem omogućava kompletno praćenje ugovora, izveštavanje, analitiku i automatizaciju poslovnih procesa.

---

## 📋 Table of Contents

1. [Tech Stack](#-tech-stack)
2. [Project Architecture](#-project-architecture)
3. [Core Modules](#-core-modules)
4. [Database Schema](#-database-schema)
5. [API Routes](#-api-routes)
6. [Authentication & Security](#-authentication--security)
7. [File Upload System](#-file-upload-system)
8. [Reporting System](#-reporting-system)
9. [AI Integration (MCP)](#-ai-integration-mcp)
10. [Deployment](#-deployment)

---

## 🛠 Tech Stack

### Frontend
- **Framework:** Next.js 15.3.3 (App Router)
- **UI Library:** React 18.3.1
- **Styling:** Tailwind CSS 3.4.1
- **Components:** shadcn/ui with Radix UI primitives
- **State Management:** React Hooks + Context API + SWR 2.3.3
- **Forms:** React Hook Form 7.53.0 + Zod 3.23.8 validation
- **Tables:** TanStack React Table 8.21.3
- **Charts:** Recharts 2.15.3
- **Icons:** Lucide React 0.447.0
- **Animation:** Framer Motion 12.7.2
- **Theme:** next-themes 0.3.0 (Dark/Light mode)
- **Notifications:** Sonner 1.5.0 + React Hot Toast 2.5.2
- **Date Handling:** date-fns 3.6.0 + React Day Picker 8.10.1
- **File Upload:** React Dropzone 14.3.8
- **Markdown:** React Markdown 10.1.0 + Remark GFM 4.0.1

### Backend
- **Runtime:** Node.js
- **Framework:** Next.js 15.3.3 API Routes
- **Database:** PostgreSQL
- **ORM:** Prisma 6.9.0
- **Authentication:** NextAuth.js v5.0.0-beta.25
- **Auth Adapter:** @auth/prisma-adapter 2.6.0
- **Password Hashing:** bcryptjs 2.4.3
- **API Client:** Axios 1.11.0
- **Caching:** Upstash Redis 1.34.8
- **Email:** Resend 4.0.0
- **Debouncing:** use-debounce 10.0.4

### File Processing
- **Excel:** ExcelJS 4.4.0 + XLSX 0.18.5
- **CSV:** Papaparse 5.5.3 + csv-parser 3.2.0 + React CSV 2.2.2
- **General:** quoted-printable 1.0.1

### AI & Automation
- **MCP SDK:** @modelcontextprotocol/sdk 1.18.1
- **LLM Integration:** OpenAI 5.20.0
- **Cron Jobs:** Contract expiration monitoring

### Development Tools
- **Language:** TypeScript 5
- **Linting:** ESLint 8
- **CSS Processing:** PostCSS 8
- **Test Data:** @faker-js/faker 9.7.0
- **Database Seeding:** ts-node 10.9.2
- **Environment:** dotenv 17.2.1
- **Utilities:** 
  - uuid 10.0.0
  - clsx 2.1.1
  - class-variance-authority 0.7.0
  - tailwind-merge 2.5.3

### DevOps & Deployment
- **Deployment:** Vercel-optimized / Docker-ready
- **Version Control:** Git
- **Database Migrations:** Prisma Migrate
- **Package Manager:** npm/yarn/pnpm
- **Build Tool:** Next.js built-in

---

## 🏗 Project Architecture

### Directory Structure

```
tres/
├── app/                          # Next.js App Router
│   ├── (protected)/             # Authenticated routes
│   │   ├── admin/               # Admin dashboard
│   │   ├── analytics/           # Business analytics
│   │   ├── complaints/          # Complaint management
│   │   ├── contracts/           # Contract management
│   │   ├── humanitarian-orgs/   # Humanitarian organizations
│   │   ├── parking-services/    # Parking service management
│   │   ├── providers/           # Provider management
│   │   ├── reports/             # Report generation
│   │   └── services/            # Service management
│   ├── api/                     # API routes
│   │   ├── admin/               # Admin APIs
│   │   ├── auth/                # Authentication
│   │   ├── complaints/          # Complaint APIs
│   │   ├── contracts/           # Contract APIs
│   │   ├── reports/             # Report APIs
│   │   └── ...
│   └── auth/                    # Auth pages (login, register)
├── actions/                     # Server Actions
│   ├── analytics/
│   ├── complaints/
│   ├── contracts/
│   ├── humanitarian-orgs/
│   ├── reports/
│   └── ...
├── components/                  # React Components
│   ├── ui/                      # shadcn/ui components
│   ├── complaints/
│   ├── contracts/
│   ├── providers/
│   └── ...
├── lib/                         # Utilities & Libraries
│   ├── auth/                    # Auth utilities
│   ├── mcp/                     # MCP Server
│   ├── notifications/           # Notification system
│   ├── security/                # Security utilities
│   └── db.ts                    # Prisma client
├── prisma/                      # Database schema & migrations
├── public/                      # Static assets
│   └── reports/                 # Generated reports
├── schemas/                     # Zod validation schemas
└── hooks/                       # Custom React hooks
```

---

## 🎯 Core Modules

### 1. **Contract Management** (`/contracts`)

**Purpose:** Upravljanje ugovorima sa providerima, parking servisima i humanitarnim organizacijama.

**Features:**
- ✅ CRUD operacije za ugovore
- ✅ Praćenje roka važenja ugovora
- ✅ Automatska notifikacija za ugovore koji ističu
- ✅ Upload attachment-a (PDF, Word, Excel)
- ✅ Renewal workflow (obnova ugovora)
- ✅ Timeline vizualizacija
- ✅ Status management (Draft, Active, Expiring, Expired)

**Key Files:**
- `app/(protected)/contracts/page.tsx` - Lista ugovora
- `app/api/contracts/route.ts` - CRUD API
- `actions/contracts/create.ts` - Server action za kreiranje
- `lib/contracts/expiration-checker.ts` - Provera isteka

**Database Tables:**
- `Contract` - Osnovni podaci o ugovoru
- `ContractAttachment` - Attachments
- `ContractReminder` - Podsetnici

---

### 2. **Humanitarian Organizations** (`/humanitarian-orgs`)

**Purpose:** Upravljanje humanitarnim organizacijama i njihovim uslugama.

**Features:**
- ✅ Registracija humanitarnih organizacija
- ✅ Praćenje kratkog broja (shortNumber)
- ✅ Povezivanje sa uslugama (SMS, Voice)
- ✅ Generisanje mesečnih izveštaja
- ✅ Upload izveštaja (Excel)
- ✅ Renewal proces

**Key Files:**
- `app/(protected)/humanitarian-orgs/page.tsx`
- `app/api/humanitarian-orgs/route.ts`
- `actions/humanitarian-orgs/create.ts`
- `components/humanitarian-orgs/HumanitarianOrgForm.tsx`

**Database Tables:**
- `HumanitarianOrg` - Organizacije
- `HumanitarianService` - Usluge (SMS/Voice)
- `HumanitarianRenewal` - Renewal zahtevi

---

### 3. **Parking Services** (`/parking-services`)

**Purpose:** Upravljanje parking uslugama i pratećim ugovorima.

**Features:**
- ✅ Registracija parking servisa
- ✅ Praćenje ugovora po parking servisu
- ✅ Generisanje izveštaja
- ✅ Import podataka iz Excel-a
- ✅ Statistika prihoda

**Key Files:**
- `app/(protected)/parking-services/page.tsx`
- `app/api/parking-services/route.ts`
- `actions/parking-services/create.ts`
- `lib/parking-services/validators.ts`

**Database Tables:**
- `ParkingService` - Parking servisi
- `ParkingContract` - Ugovori

---

### 4. **Provider Management** (`/providers`)

**Purpose:** Upravljanje telekom providerima (Telekom, Telenor, A1, Globaltel).

**Features:**
- ✅ CRUD operacije za providere
- ✅ Praćenje aktivnih/neaktivnih providera
- ✅ Povezivanje sa uslugama (VAS, Bulk SMS)
- ✅ Ugovori po provideru
- ✅ Import VAS usluga

**Key Files:**
- `app/(protected)/providers/page.tsx`
- `app/api/providers/route.ts`
- `actions/providers/create.ts`
- `components/providers/ProviderForm.tsx`

**Database Tables:**
- `Provider` - Providerи
- `ProviderContract` - Ugovori sa providerima

---

### 5. **Service Management** (`/services`)

**Purpose:** Upravljanje svim vrstama usluga (VAS, Bulk SMS, Humanitarian, Parking).

**Features:**
- ✅ Multi-category sistem (VAS, BULK, HUMANITARIAN, PARKING)
- ✅ Import iz Excel/CSV
- ✅ Bulk operacije
- ✅ Statistika po kategorijama
- ✅ Filter i search

**Key Files:**
- `app/(protected)/services/page.tsx`
- `app/api/services/route.ts`
- `actions/services/create.ts`
- `lib/services/csv-processor.ts`

**Database Tables:**
- `Service` - Sve usluge (VAS, Bulk, etc.)
- `VasService` - VAS specifični podaci
- `BulkService` - Bulk SMS specifični podaci

---

### 6. **Complaints Management** (`/complaints`)

**Purpose:** Sistem za upravljanje prigovorima i reklamacijama.

**Features:**
- ✅ Kreiranje prigovora
- ✅ Status tracking (Open, In Progress, Resolved, Closed)
- ✅ Dodela prigovora korisnicima (assign)
- ✅ Komentari i thread komunikacija
- ✅ Attachment upload
- ✅ Export u Excel
- ✅ Statistika i analitika

**Key Files:**
- `app/(protected)/complaints/page.tsx`
- `app/api/complaints/route.ts`
- `actions/complaints/create.ts`
- `components/complaints/ComplaintForm.tsx`

**Database Tables:**
- `Complaint` - Prigovori
- `ComplaintComment` - Komentari
- `ComplaintAttachment` - Attachments

---

### 7. **Analytics & Reporting** (`/analytics`, `/reports`)

**Purpose:** Business intelligence i reporting sistem.

**Features:**
- ✅ Dashboard sa KPI metrikama
- ✅ Financial analytics (revenue, costs)
- ✅ Sales analytics (by provider, service)
- ✅ Complaint analytics (trends, resolution time)
- ✅ Contract analytics (expiring, renewal rate)
- ✅ Custom report generation
- ✅ Scheduled reports
- ✅ Export u Excel/PDF

**Key Files:**
- `app/(protected)/analytics/page.tsx`
- `app/(protected)/reports/generate/page.tsx`
- `actions/reports/generate-excel.ts`
- `actions/analytics/get-financial-data.ts`

**Database Tables:**
- `ReportFile` - Generisani izveštaji
- `ScheduledReport` - Scheduled reports

---

### 8. **Admin Dashboard** (`/admin`)

**Purpose:** Administrativni panel za sistem monitoring i user management.

**Features:**
- ✅ User role management
- ✅ Permission system
- ✅ Activity logs
- ✅ System health monitoring
- ✅ Performance metrics (API response times, DB queries)
- ✅ Security audit logs
- ✅ MCP AI dashboard
- ✅ Notification management

**Key Files:**
- `app/(protected)/admin/page.tsx`
- `app/(protected)/admin/security/page.tsx`
- `app/(protected)/admin/aidash/page.tsx`
- `lib/security/audit-logger.ts`

**Database Tables:**
- `User` - Korisnici
- `SecurityLog` - Security audit trail
- `PerformanceMetric` - Performance tracking
- `ActivityLog` - User activity

---

## 🗄 Database Schema

### Core Entities

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  password      String?
  role          UserRole  @default(USER)
  image         String?
  // Relations
  accounts      Account[]
  complaints    Complaint[]
  assignedComplaints Complaint[] @relation("AssignedTo")
  // ... more relations
}

model Provider {
  id          String   @id @default(cuid())
  name        String   @unique
  contactInfo String?
  isActive    Boolean  @default(true)
  // Relations
  contracts   ProviderContract[]
  vasServices VasService[]
  bulkServices BulkService[]
}

model Contract {
  id             String         @id @default(cuid())
  contractNumber String?        @unique
  startDate      DateTime
  endDate        DateTime
  status         ContractStatus @default(DRAFT)
  renewalStatus  RenewalStatus?
  // Relations
  provider       Provider?
  parkingService ParkingService?
  humanitarianOrg HumanitarianOrg?
  services       Service[]
  attachments    ContractAttachment[]
}

model HumanitarianOrg {
  id           String   @id @default(cuid())
  name         String   @unique
  shortNumber  String?  @unique
  contactEmail String?
  contactPhone String?
  // Relations
  contracts    Contract[]
  services     HumanitarianService[]
  renewals     HumanitarianRenewal[]
}

model Service {
  id          String          @id @default(cuid())
  name        String
  category    ServiceCategory
  isActive    Boolean         @default(true)
  // Relations
  provider    Provider?
  contract    Contract?
  complaints  Complaint[]
}

model Complaint {
  id          String           @id @default(cuid())
  title       String
  description String
  status      ComplaintStatus  @default(OPEN)
  priority    Priority?
  // Relations
  createdBy   User
  assignedTo  User?
  service     Service?
  comments    ComplaintComment[]
  attachments ComplaintAttachment[]
}
```

### Enums

```prisma
enum UserRole {
  ADMIN
  USER
  OPERATOR
  VIEWER
}

enum ServiceCategory {
  VAS
  BULK
  HUMANITARIAN
  PARKING
}

enum ContractStatus {
  DRAFT
  ACTIVE
  EXPIRING
  EXPIRED
  RENEWED
  TERMINATED
}

enum ComplaintStatus {
  OPEN
  IN_PROGRESS
  RESOLVED
  CLOSED
}
```

---

## 🔌 API Routes

### Authentication APIs

```
POST   /api/auth/[...nextauth]     # NextAuth endpoints
POST   /api/auth/register          # User registration
POST   /api/auth/login             # User login
POST   /api/auth/logout            # User logout
```

### Contract APIs

```
GET    /api/contracts              # List contracts (with filters)
POST   /api/contracts              # Create contract
GET    /api/contracts/[id]         # Get contract by ID
PUT    /api/contracts/[id]         # Update contract
DELETE /api/contracts/[id]         # Delete contract
GET    /api/contracts/expiring     # Get expiring contracts
POST   /api/contracts/[id]/renewal # Initiate renewal
GET    /api/contracts/export       # Export contracts to Excel
```

### Humanitarian Organization APIs

```
GET    /api/humanitarian-orgs           # List organizations
POST   /api/humanitarian-orgs           # Create organization
GET    /api/humanitarian-orgs/[id]      # Get organization
PUT    /api/humanitarian-orgs/[id]      # Update organization
DELETE /api/humanitarian-orgs/[id]      # Delete organization
GET    /api/humanitarian-orgs/[id]/services    # Get organization services
GET    /api/humanitarian-orgs/[id]/contracts   # Get organization contracts
```

### Provider APIs

```
GET    /api/providers              # List providers
POST   /api/providers              # Create provider
GET    /api/providers/[id]         # Get provider
PUT    /api/providers/[id]         # Update provider
DELETE /api/providers/[id]         # Delete provider
GET    /api/providers/[id]/contracts      # Get provider contracts
GET    /api/providers/[id]/vas-services   # Get VAS services
GET    /api/providers/[id]/bulk-services  # Get Bulk services
```

### Service APIs

```
GET    /api/services               # List services
POST   /api/services               # Create service
GET    /api/services/[id]          # Get service
PUT    /api/services/[id]          # Update service
DELETE /api/services/[id]          # Delete service
POST   /api/services/import        # Import services (CSV/Excel)
GET    /api/services/categories    # Get service categories
```

### Complaint APIs

```
GET    /api/complaints             # List complaints
POST   /api/complaints             # Create complaint
GET    /api/complaints/[id]        # Get complaint
PUT    /api/complaints/[id]        # Update complaint
DELETE /api/complaints/[id]        # Delete complaint
POST   /api/complaints/[id]/comments     # Add comment
GET    /api/complaints/[id]/attachments  # Get attachments
POST   /api/complaints/[id]/status       # Change status
GET    /api/complaints/statistics        # Get statistics
GET    /api/complaints/export            # Export to Excel
```

### Report APIs

```
POST   /api/reports/generate               # Generate report
POST   /api/reports/upload-humanitarian    # Upload humanitarian report
POST   /api/reports/upload-parking         # Upload parking report
POST   /api/reports/upload-provider        # Upload provider report
GET    /api/reports/scan-unified           # Scan all reports
POST   /api/reports/validate-system        # Validate report system
```

### Analytics APIs

```
GET    /api/analytics/financials   # Financial analytics
GET    /api/analytics/sales        # Sales analytics
```

### Admin APIs

```
GET    /api/admin/mcp/stats              # MCP statistics
GET    /api/admin/mcp/logs               # MCP logs
GET    /api/admin/mcp/users              # User list
GET    /api/admin/mcp/system-health      # System health
POST   /api/security/logs                # Security logs
GET    /api/security/performance         # Performance metrics
```

---

## 🔐 Authentication & Security

### NextAuth Configuration

**File:** `auth.ts`, `auth.config.ts`

```typescript
// Providers
- Credentials (email/password)
- Google OAuth (optional)

// Session Strategy
- JWT-based sessions
- 30-day expiration

// Callbacks
- jwt: Add user role to token
- session: Add role to session object
```

### Authorization

**Role-based Access Control (RBAC)**

```typescript
enum UserRole {
  ADMIN    // Full access
  USER     // Standard access
  OPERATOR // Limited operations
  VIEWER   // Read-only access
}
```

**Permission Gates:**
- `<RoleGate>` component for UI protection
- `checkPermission()` function for API protection
- Middleware for route protection

### Security Features

1. **Audit Logging** (`lib/security/audit-logger.ts`)
   - Tracks all user actions
   - Records IP, timestamp, entity changes

2. **Rate Limiting** (`lib/security/rate-limiter.ts`)
   - Prevents API abuse
   - Configurable limits per endpoint

3. **Input Validation**
   - Zod schemas for all inputs
   - SQL injection prevention (Prisma ORM)

4. **File Upload Security**
   - File type validation
   - Size limits
   - Virus scanning (optional)

---

## 📤 File Upload System

### Upload Endpoints

```typescript
POST /api/reports/upload-humanitarian
POST /api/reports/upload-parking
POST /api/reports/upload-provider
POST /api/parking-services/upload
POST /api/providers/upload
```

### File Storage Structure

```
public/reports/
├── {orgId} - {orgName}/          # Humanitarian reports
│   ├── {year}/
│   │   ├── {month}/
│   │   │   ├── postpaid/
│   │   │   └── prepaid/
├── parking/                       # Parking reports
│   └── {parkingId}/
│       └── {year}/{month}/
└── providers/                     # Provider reports
    └── {providerId}/
        └── {year}/{month}/
```

### Upload Handler (Humanitarian Example)

**File:** `app/api/reports/upload-humanitarian/route.ts`

```typescript
export async function POST(request: NextRequest) {
  // 1. Parse multipart form data
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const organizationId = formData.get('organizationId');
  
  // 2. Validate inputs
  if (!file || !organizationId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  
  // 3. Get organization details
  const organization = await db.humanitarianOrg.findUnique({
    where: { id: organizationId }
  });
  
  // 4. Build folder path (DIRECTLY FROM DATABASE)
  const orgFolderName = `${organization.shortNumber} - ${organization.name}`;
  const uploadsDir = path.join(
    process.cwd(), 
    'public', 
    'reports', 
    orgFolderName, 
    folderPath
  );
  
  // 5. Create directory
  await mkdir(uploadsDir, { recursive: true });
  
  // 6. Save file
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  await writeFile(path.join(uploadsDir, file.name), buffer);
  
  // 7. Save metadata to database
  await db.reportFile.create({
    data: {
      fileName: file.name,
      filePath: `/reports/${orgFolderName}/${folderPath}/${file.name}`,
      fileSize: file.size,
      category: 'HUMANITARIAN',
      organizationId,
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    }
  });
  
  return NextResponse.json({ message: 'Success' });
}
```

### Database Schema for Files

```prisma
model ReportFile {
  id             String   @id @default(cuid())
  fileName       String
  filePath       String   @unique
  fileSize       Int
  mimeType       String?
  category       FileCategory
  reportType     ReportType?
  startDate      DateTime
  endDate        DateTime
  isMonthlyReport Boolean  @default(false)
  uploadedAt     DateTime @default(now())
  
  organizationId String?
  organization   HumanitarianOrg? @relation(fields: [organizationId])
}

enum FileCategory {
  HUMANITARIAN
  PARKING
  PROVIDER
}

enum ReportType {
  PREPAID
  POSTPAID
}
```

---

## 📊 Reporting System

### Report Generation Flow

1. **Template Creation** (`actions/reports/humanitarian/generators/`)
   - `template-generator.ts` - Creates Excel templates
   - Uses ExcelJS library

2. **Data Collection** (`actions/reports/humanitarian/data/`)
   - `fetch-organizations.ts` - Fetches organization data
   - Aggregates data from multiple sources

3. **Report Generation** (`actions/reports/humanitarian/generators/`)
   - `prepaid-generator.ts` - Generates prepaid reports
   - `postpaid-generator.ts` - Generates postpaid reports
   - `humanitarian-unified-generator.ts` - Unified report

4. **File Processing** (`actions/reports/humanitarian/core/`)
   - `excel-reader.ts` - Reads uploaded Excel files
   - `excel-writer.ts` - Writes data to Excel
   - `counter-manager.ts` - Manages monthly counters

### Key Report Files

```typescript
// Generate all humanitarian reports
actions/reports/generate-all-humanitarian-reports.ts

// Generate Excel reports
actions/reports/generate-excel.ts

// Scan unified reports
actions/reports/scan-unified-reports.ts

// Reset monthly counters
actions/reports/reset-monthly-counters.ts
```

### Report Types

1. **Humanitarian Reports**
   - Prepaid (SMS/Voice usage)
   - Postpaid (monthly billing)
   - Unified (combined view)

2. **Parking Reports**
   - Daily revenue
   - Monthly summaries
   - Transaction logs

3. **Provider Reports**
   - VAS service usage
   - Bulk SMS statistics
   - Revenue breakdown

---

## 🤖 AI Integration (MCP)

### Model Context Protocol (MCP)

**Location:** `lib/mcp/`

**Purpose:** AI-powered assistant za query-e baze podataka i sistem operacije.

### MCP Server Components

1. **Internal Server** (`internal-server.ts`)
   ```typescript
   // Handles tool invocations
   // Provides context to AI
   // Manages read/write operations
   ```

2. **Read Operations** (`read-operations.ts`)
   ```typescript
   // Search humanitarian organizations
   // Get contract details
   // Fetch service data
   // Query analytics
   ```

3. **Write Tools** (`write-tools.ts`)
   ```typescript
   // Create entities
   // Update records
   // Delete entries
   ```

4. **Query Logger** (`query-logger.ts`)
   ```typescript
   // Logs all MCP queries
   // Tracks tool usage
   // Monitors performance
   ```

### AI Dashboard

**Location:** `app/(protected)/admin/aidash/`

**Features:**
- ✅ Real-time MCP statistics
- ✅ Tool usage analytics
- ✅ User query history
- ✅ System health monitoring
- ✅ Chat interface for AI queries

### MCP API Endpoints

```
GET  /api/admin/mcp/stats              # MCP statistics
GET  /api/admin/mcp/logs               # Query logs
GET  /api/admin/mcp/users              # User activity
GET  /api/admin/mcp/tools-usage        # Tool usage stats
POST /api/admin/mcp/refresh            # Refresh MCP cache
GET  /api/admin/mcp/system-health      # System health check
```

---

## 🚀 Deployment

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/db"

# NextAuth
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-secret-key"

# Email (Optional)
RESEND_API_KEY="your-resend-key"

# OAuth (Optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

### Build Commands

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Build application
npm run build

# Start production server
npm start
```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### Vercel Deployment

1. Connect GitHub repo
2. Set environment variables
3. Configure build settings:
   - Build Command: `npm run build`
   - Output Directory: `.next`
4. Deploy

---

## 📈 Performance Optimization

### Database Optimization

1. **Indexes:**
   ```prisma
   @@index([category])
   @@index([status])
   @@index([createdAt])
   ```

2. **Query Optimization:**
   - Use `select` to limit fields
   - Use `include` only when needed
   - Implement pagination

3. **Caching:**
   - React Query for client-side caching
   - Server-side caching with Redis (optional)

### Frontend Optimization

1. **Code Splitting:**
   - Dynamic imports for heavy components
   - Route-based code splitting (automatic in Next.js)

2. **Image Optimization:**
   - Next.js Image component
   - WebP format
   - Lazy loading

3. **Bundle Size:**
   - Tree shaking
   - Remove unused dependencies
   - Analyze with `@next/bundle-analyzer`

---

## 🧪 Testing

### Unit Tests (Example)

```typescript
// __tests__/lib/contracts/expiration-checker.test.ts
import { checkExpiringContracts } from '@/lib/contracts/expiration-checker';

describe('Contract Expiration Checker', () => {
  it('should identify contracts expiring in 30 days', async () => {
    const expiringContracts = await checkExpiringContracts(30);
    expect(expiringContracts.length).toBeGreaterThan(0);
  });
});
```

### Integration Tests

```typescript
// __tests__/api/contracts.test.ts
import { POST } from '@/app/api/contracts/route';

describe('Contract API', () => {
  it('should create a new contract', async () => {
    const response = await POST(mockRequest);
    expect(response.status).toBe(201);
  });
});
```

---

## 📚 Additional Documentation

### API Documentation
**File:** `docs/PROJECT_API_DOCUMENTATION.md`
- Detailed API endpoint documentation
- Request/response examples
- Error codes

### API Structure
**File:** `docs/PROJECT_API_STRUCTURE.md`
- API architecture overview
- Routing patterns
- Middleware flow

### Database Documentation
**File:** `baza-podataka.md`
- Complete schema documentation
- Entity relationships
- Migration history

### Architecture Documentation
**File:** `arhitektura.md`
- System architecture
- Design patterns
- Technology decisions

---

## 🐛 Troubleshooting

### Common Issues

1. **Prisma Client not found**
   ```bash
   npx prisma generate
   ```

2. **Database connection error**
   - Check `DATABASE_URL`
   - Ensure database is running
   - Run migrations: `npx prisma migrate deploy`

3. **File upload fails**
   - Check folder permissions
   - Ensure `public/reports/` exists
   - Verify file size limits

4. **NextAuth session issues**
   - Clear cookies
   - Check `NEXTAUTH_SECRET`
   - Verify `NEXTAUTH_URL`

---

## 👥 Contributing

### Development Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes
3. Run tests: `npm test`
4. Commit: `git commit -m "feat: your feature"`
5. Push: `git push origin feature/your-feature`
6. Create Pull Request

### Code Style

- Use TypeScript strict mode
- Follow ESLint rules
- Use Prettier for formatting
- Write JSDoc comments for complex functions

---

## 📄 License

Proprietary - All rights reserved

---

## 📞 Support

**Email:** support@tres-system.com  
**Documentation:** https://docs.tres-system.com  
**GitHub Issues:** https://github.com/your-org/tres/issues

---

**Last Updated:** October 2025  
**Version:** 1.0.0  
**Maintained by:** TRES Development Team