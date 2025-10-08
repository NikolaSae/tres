# 📱 TRES - Telco Regulation & Expense System

> Sveobuhvatna Next.js aplikacija za upravljanje telekomunikacionim uslugama, humanitarnim organizacijama, parking servisima i ugovorima.

---

## 🚀 Brzi Start

```bash
# Kloniraj repository
git clone https://github.com/your-org/tres.git
cd tres

# Instaliraj dependencies
npm install

# Postavi environment variables
cp .env.example .env
# Edituj .env i dodaj svoje kredencijale

# Pokreni Prisma migracije
npx prisma migrate dev
npx prisma generate

# Seed bazu sa test podacima (opciono)
npm run seed

# Pokreni development server
npm run dev
```

Otvori [http://localhost:3000](http://localhost:3000) u browseru.

---

## 📋 Glavne Funkcionalnosti

### 📝 Upravljanje Ugovorima
- ✅ CRUD operacije za ugovore sa providerima
- ✅ Automatsko praćenje isteka ugovora
- ✅ Email notifikacije za ugovore koji ističu
- ✅ Upload attachment-a (PDF, Word, Excel)
- ✅ Workflow proces obnove ugovora
- ✅ Timeline vizualizacija istorije

### 🏢 Humanitarne Organizacije
- ✅ Registracija i praćenje organizacija
- ✅ Upravljanje kratkim brojevima (shortNumbers)
- ✅ SMS i Voice usluge
- ✅ Mesečni izveštaji
- ✅ Proces obnove ugovora

### 🅿️ Parking Servisi
- ✅ Registracija parking servisa
- ✅ Praćenje ugovora po servisu
- ✅ Import podataka iz Excel/CSV
- ✅ Statistika prihoda

### 📡 Telekom Provideri
- ✅ Upravljanje providerima (Telekom, Telenor, A1, Globaltel)
- ✅ VAS i Bulk SMS usluge
- ✅ Povezivanje sa ugovorima
- ✅ Import iz Excel-a

### 📊 Izveštaji i Analitika
- ✅ Generisanje PDF/CSV/Excel izveštaja
- ✅ Filtriranje po različitim kriterijumima
- ✅ Dashboard sa metrikama
- ✅ Automatski mesečni izveštaji

### 🤖 AI Integracija
- ✅ Automatska obrada email-a
- ✅ Ekstrakcija podataka iz dokumenata
- ✅ Predikcije za renewals
- ✅ MCP (Model Context Protocol) podrška

---

## 🛠 Tech Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **UI Library:** React 18
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui + Radix UI
- **Forms:** React Hook Form + Zod
- **Tables:** TanStack React Table
- **Charts:** Recharts
- **Icons:** Lucide React
- **Notifications:** Sonner + React Hot Toast

### Backend
- **Framework:** Next.js API Routes + Server Actions
- **Database:** PostgreSQL (Supabase)
- **ORM:** Prisma 6.9.0
- **Authentication:** NextAuth.js v5
- **Email:** Resend
- **Cache:** Upstash Redis
- **AI:** OpenAI + MCP SDK

### File Processing
- **Excel:** ExcelJS, XLSX
- **CSV:** Papaparse, csv-parser
- **PDF:** React PDF

### DevOps
- **Deployment:** Vercel
- **CI/CD:** GitHub Actions
- **Monitoring:** Vercel Analytics
- **Database:** Supabase (PostgreSQL)

---

## 📁 Struktura Projekta

```
tres/
├── app/                          # Next.js App Router
│   ├── (protected)/             # Zaštićene rute
│   │   ├── contracts/           # Upravljanje ugovorima
│   │   ├── providers/           # Telekom provideri
│   │   ├── humanitarian-orgs/   # Humanitarne org.
│   │   ├── parking-services/    # Parking servisi
│   │   ├── services/            # VAS/Bulk usluge
│   │   ├── reports/             # Izveštaji
│   │   └── analytics/           # Analitika
│   ├── api/                     # API endpoints
│   │   ├── auth/                # Autentifikacija
│   │   ├── contracts/           # Contract APIs
│   │   └── cron/                # Cron jobs
│   └── auth/                    # Login/Register stranice
├── actions/                     # Server Actions
│   ├── contracts/
│   ├── providers/
│   └── reports/
├── components/                  # React komponente
│   ├── ui/                      # shadcn/ui komponente
│   ├── contracts/
│   └── providers/
├── lib/                         # Utilities
│   ├── auth/                    # Auth helpers
│   ├── db.ts                    # Prisma client
│   ├── mcp/                     # MCP server
│   └── validators/              # Zod sheme
├── prisma/                      # Database schema
│   ├── schema.prisma
│   └── migrations/
└── public/                      # Static assets
    ├── uploads/                 # User uploads
    └── reports/                 # Generated reports
```

---

## ⚙️ Konfiguracija

### Environment Variables

Kreiraj `.env` fajl u root folderu:

```bash
# Database (Supabase)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-here"

# Email (Resend)
RESEND_API_KEY="re_..."

# AI (OpenAI)
OPENAI_API_KEY="sk-..."

# Cache (Upstash Redis) - opciono
UPSTASH_REDIS_URL="https://..."
UPSTASH_REDIS_TOKEN="..."

# Cron Jobs
CRON_SECRET="your-cron-secret"
```

### Prisma Setup

```bash
# Generiši Prisma client
npx prisma generate

# Kreiraj migraciju
npx prisma migrate dev --name init

# Primeni migracije u produkciji
npx prisma migrate deploy

# Otvori Prisma Studio (GUI za bazu)
npx prisma studio
```

### Seed Database

```bash
# Pokreni seed skriptu
npm run seed

# Ili direktno
npx prisma db seed
```

**Seed podaci uključuju:**
- Demo korisnici (admin@example.com / user@example.com)
- Telekom provideri (Telekom, Telenor, A1, Globaltel)
- Test humanitarne organizacije
- Sample ugovori i usluge

---

## 🔒 Autentifikacija

TRES koristi **NextAuth.js v5** za autentifikaciju.

### Default Kredencijali (nakon seed-a)

```
Admin korisnik:
Email: admin@example.com
Password: admin123

Običan korisnik:
Email: user@example.com
Password: user123
```

### Role-Based Access Control

- **ADMIN** - Pun pristup svim funkcionalnostima
- **USER** - Standardni pristup
- **VIEWER** - Samo čitanje

---

## 📊 Baza Podataka

### Šema

Glavni entiteti:

```
User ─┬─> Provider ──> Contract ──> ContractAttachment
      ├─> HumanitarianOrg ──> HumanitarianService
      ├─> ParkingService
      └─> Service (VAS/Bulk)
```

### Migracije

```bash
# Kreiraj novu migraciju
npx prisma migrate dev --name add_new_field

# Resetuj bazu (PAŽLJIVO!)
npx prisma migrate reset

# Proveri status migracija
npx prisma migrate status
```

### Backup

```bash
# Eksportuj bazu
pg_dump $DATABASE_URL > backup.sql

# Importuj bazu
psql $DATABASE_URL < backup.sql
```

---

## 🚀 Deployment

### Vercel (Preporučeno)

```bash
# Instaliraj Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deploy
vercel --prod
```

**Konfiguracija:**
1. Konektuj GitHub repository
2. Dodaj environment variables u Vercel dashboard
3. Automatski deploy na svaki push

### Docker

```bash
# Build image
docker build -t tres .

# Run container
docker run -p 3000:3000 tres
```

---

## 📦 Npm Scripts

```bash
# Development
npm run dev              # Pokreni dev server
npm run build            # Build za produkciju
npm run start            # Pokreni production build
npm run lint             # Linting

# Database
npm run db:push          # Push schema promene
npm run db:studio        # Otvori Prisma Studio
npm run seed             # Seed bazu

# Package Management
npm run check-updates    # Proveri dostupne update-e
npm run outdated         # Zastareli paketi
npm run update-all       # Update sve pakete
```

---

## 🧪 Testiranje

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

---

## 📈 Monitoring

### Cron Jobs

TRES ima automatske cron job-ove za:

- ✅ Provera ugovora koji ističu (svaki dan u 9:00)
- ✅ Slanje email notifikacija
- ✅ Generisanje mesečnih izveštaja

**Konfiguracija u `vercel.json`:**

```json
{
  "crons": [{
    "path": "/api/cron/check-expirations",
    "schedule": "0 9 * * *"
  }]
}
```

### Logs

```bash
# Vercel logs (production)
vercel logs

# Local logs
npm run dev
# Logs se prikazuju u konzoli
```

---

## 🤝 Contributing

### Workflow

1. Fork repository
2. Kreiraj feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit promene (`git commit -m 'Add some AmazingFeature'`)
4. Push na branch (`git push origin feature/AmazingFeature`)
5. Otvori Pull Request

### Code Style

- ESLint konfiguracija
- Prettier formatiranje
- TypeScript strict mode
- JSDoc komentari za funkcije

---

## 🐛 Poznati Problemi

- [ ] MCP server zahteva manuelnu konfiguraciju
- [ ] Email attachments limitirani na 10MB
- [ ] Excel import radi samo sa .xlsx formatom

---

## 📚 Dodatna Dokumentacija

- [Arhitektura Sistema](docs/arhitektura.md)
- [Šema Baze](docs/baza-podataka.md)
- [API Dokumentacija](docs/PROJECT_API_DOCUMENTATION.md)
- [Struktura Projekta](docs/PROJECT_STRUCTURE.md)

---

##