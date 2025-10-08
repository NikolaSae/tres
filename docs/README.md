# 📱 Fin-App-Hub - Telco Regulation & Expense System

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

- [Arhitektura Sistema](docs/arhitektura.md) - Detaljan pregled arhitekture
- [Šema Baze](docs/baza-podataka.md) - Kompletna šema baze podataka
- [API Dokumentacija](docs/PROJECT_API_DOCUMENTATION.md) - Svi API endpoints
- [Struktura Projekta](docs/PROJECT_STRUCTURE.md) - Organizacija fajlova
- [API Struktura](docs/PROJECT_API_STRUCTURE.md) - API organizacija

---

## 🔧 Česte Komande

### Development

```bash
# Pokreni dev server
npm run dev

# Build aplikaciju
npm run build

# Pokreni production build lokalno
npm run start

# Linting
npm run lint

# Format kod
npm run format
```

### Database

```bash
# Generiši Prisma client
npx prisma generate

# Kreiraj migraciju
npx prisma migrate dev

# Primeni migracije
npx prisma migrate deploy

# Otvori Prisma Studio
npx prisma studio

# Reset baze (PAŽLJIVO!)
npx prisma migrate reset

# Seed bazu
npm run seed
```

### Package Management

```bash
# Proveri outdated pakete
npm outdated

# Update specifičan paket
npm install <package>@latest

# Update sve minor/patch verzije
npm update

# Proveri security vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

---

## 📖 Kako Koristiti TRES

### 1. Kreiranje Novog Ugovora

1. Idi na **Contracts** → **New Contract**
2. Izaberi tip ugovora (Provider, Humanitarian, Parking)
3. Popuni obavezna polja
4. Dodaj attachment-e (opciono)
5. Klikni **Create Contract**

### 2. Praćenje Isteka Ugovora

1. Idi na **Contracts** → **Expiring Contracts**
2. Vidi sve ugovore koji ističu u narednih 60 dana
3. Klikni na ugovor za detalje
4. Pokreni renewal proces

### 3. Generisanje Izveštaja

1. Idi na **Reports**
2. Izaberi tip izveštaja (Contracts, Providers, Services)
3. Postavi filtere (datum, status, provider)
4. Klikni **Generate Report**
5. Download PDF/Excel

### 4. Import Podataka iz Excel-a

1. Idi na modul (Services, Contracts, Providers)
2. Klikni **Import**
3. Upload Excel fajl (.xlsx)
4. Mapuj kolone
5. Potvrdi import

### 5. AI Obrada Email-a

1. Pošalji email na configured MCP endpoint
2. Sistem automatski ekstraktuje podatke
3. Kreira draft ugovor
4. Proveri i odobri draft

---

## 🔐 Security Best Practices

### Password Policy

- Minimalno 8 karaktera
- Kombinacija slova, brojeva i simbola
- Redovna promena lozinke (preporučeno svaka 3 meseca)

### Data Protection

- Svi osjetljivi podaci su enkriptovani
- HTTPSOnly u produkciji
- Regular security audits
- Role-based access control

### Backup Strategy

```bash
# Daily automated backups (Supabase)
# Weekly manual exports
# Monthly archive backups

# Manual backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

---

## 🆘 Troubleshooting

### Problem: "Database connection failed"

**Rešenje:**
```bash
# Proveri DATABASE_URL u .env
# Proveri Supabase connection
# Proveri mrežnu konekciju
```

### Problem: "Prisma client not generated"

**Rešenje:**
```bash
npx prisma generate
```

### Problem: "NextAuth session undefined"

**Rešenje:**
```bash
# Proveri NEXTAUTH_SECRET u .env
# Proveri NEXTAUTH_URL
# Restartuj server
```

### Problem: "Email notifications not sending"

**Rešenje:**
```bash
# Proveri RESEND_API_KEY
# Proveri email template
# Proveri Resend dashboard za logs
```

### Problem: "File upload fails"

**Rešenje:**
```bash
# Proveri upload folder permissions
mkdir -p public/uploads/contracts
chmod 755 public/uploads
```

---

## 📞 Support i Resursi

### Kontakt

- **Email:** support@tres-system.com
- **GitHub Issues:** [github.com/your-org/tres/issues](https://github.com/your-org/tres/issues)
- **Documentation:** [docs.tres-system.com](https://docs.tres-system.com)

### Eksterne Reference

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [NextAuth.js Guide](https://authjs.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## 📝 Changelog

### Version 1.0.0 (Januar 2025)

**Nove Funkcionalnosti:**
- ✅ Kompletan sistem za upravljanje ugovorima
- ✅ AI integracija za obradu email-a
- ✅ Automatski cron jobs za proveru isteka
- ✅ Excel/CSV import/export
- ✅ Dashboard sa analitikom

**Poboljšanja:**
- ✅ Optimizovane database upite
- ✅ Bolji UX za forme
- ✅ Responsive dizajn za mobile
- ✅ Email notifikacije

**Bug Fixes:**
- 🐛 Fixed contract expiration calculation
- 🐛 Fixed file upload size limits
- 🐛 Fixed timezone issues

---

## 🎯 Roadmap

### Q1 2025

- [ ] Mobile aplikacija (React Native)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support (EN/SR)
- [ ] API documentation portal

### Q2 2025

- [ ] Audit log system
- [ ] Advanced reporting with charts
- [ ] Integration sa ERP sistemima
- [ ] Workflow automation builder

### Q3 2025

- [ ] Machine learning za predviđanje troškova
- [ ] Real-time collaboration
- [ ] Document versioning
- [ ] Advanced search sa Elasticsearch

---

## ⭐ Contributors

Hvala svima koji su doprineli ovom projektu!

<!-- Add contributors list here -->

---

## 📄 License

**Proprietary Software** - All rights reserved.

Ova aplikacija je vlasništvo [Your Company Name]. Neovlašćeno kopiranje, distribucija ili izmena je zabranjena.

Za komercijalne licence, kontaktirajte: licensing@tres-system.com

---

## 🙏 Acknowledgments

- Next.js tim za odličan framework
- Vercel za hosting platform
- Prisma za odličan ORM
- shadcn za UI komponente
- Svi open source contributori

---

**Verzija:** 1.0.0  
**Poslednje Ažuriranje:** Januar 2025  
**Status:** ✅ Production Ready  
**Održava:** TRES Development Team

---

<div align="center">
  <strong>Napravljeno sa ❤️ koristeći Next.js</strong>
</div>