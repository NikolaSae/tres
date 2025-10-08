# 📚 TRES - Sistem za Regulaciju Telekomunikacija i Troškova

## 🎯 Kratak Pregled

**TRES** je sveobuhvatna Next.js aplikacija za upravljanje telekomunikacionim uslugama, humanitarnim organizacijama, parking servisima i ugovorima sa providerima. Sistem omogućava kompletno praćenje ugovora, izveštavanje, analitiku i automatizaciju poslovnih procesa.

---

## 📋 Sadržaj

1. [Tehnologije](#-tehnologije)
2. [Arhitektura Projekta](#-arhitektura-projekta)
3. [Glavni Moduli](#-glavni-moduli)
4. [Šema Baze Podataka](#-šema-baze-podataka)
5. [API Rute](#-api-rute)
6. [Autentifikacija i Bezbednost](#-autentifikacija-i-bezbednost)
7. [Sistem za Upload Fajlova](#-sistem-za-upload-fajlova)
8. [Sistem Izveštavanja](#-sistem-izveštavanja)
9. [AI Integracija (MCP)](#-ai-integracija-mcp)
10. [Deployment](#-deployment)

---

## 🛠 Tech Stack

### 📦 Provera Verzija Paketa

```bash
# Proveri dostupne update-e
npm run check-updates
# Interaktivno izaberi šta da update-uješ
npm run check-updates:interactive
# Ažuriraj sve pakete na najnovije verzije
npm run update-all
# Proveri zastarele pakete
npm run outdated
```

### Frontend
| Paket | Verzija | Status |
|-------|---------|--------|
| **Framework:** Next.js (App Router) | 15.3.3 | ![Latest](https://img.shields.io/badge/latest-15.5.4-green) |
| **UI Biblioteka:** React | 18.3.1 | ✅ Najnovija |
| **Stilizacija:** Tailwind CSS | 3.4.1 | ✅ Najnovija |
| **Komponente:** shadcn/ui | - | sa Radix UI primitivima |
| **State Management:** SWR | 2.3.3 | ✅ Najnovija |
| **Forme:** React Hook Form | 7.53.0 | ✅ Najnovija |
| **Validacija:** Zod | 3.23.8 | ✅ Najnovija |
| **Tabele:** TanStack React Table | 8.21.3 | ✅ Najnovija |
| **Grafikoni:** Recharts | 2.15.3 | ✅ Najnovija |
| **Ikone:** Lucide React | 0.447.0 | ![Update](https://img.shields.io/badge/update-available-orange) |
| **Animacija:** Framer Motion | 12.7.2 | ✅ Najnovija |
| **Tema:** next-themes | 0.3.0 | ✅ Najnovija |
| **Notifikacije:** Sonner | 1.5.0 | ✅ Najnovija |
| **Notifikacije:** React Hot Toast | 2.5.2 | ✅ Najnovija |
| **Datum:** date-fns | 3.6.0 | ✅ Najnovija |
| **Date Picker:** React Day Picker | 8.10.1 | ✅ Najnovija |
| **Upload:** React Dropzone | 14.3.8 | ✅ Najnovija |
| **Markdown:** React Markdown | 10.1.0 | ✅ Najnovija |
| **Markdown:** Remark GFM | 4.0.1 | ✅ Najnovija |

### Backend
| Paket | Verzija | Status |
|-------|---------|--------|
| **Runtime:** Node.js | - | LTS preporučena |
| **Framework:** Next.js API Routes | 15.3.3 | ![Latest](https://img.shields.io/badge/latest-15.5.4-green) |
| **Baza:** PostgreSQL | - | Supabase |
| **ORM:** Prisma | 6.9.0 | ✅ Najnovija |
| **Auth:** NextAuth.js | 5.0.0-beta.25 | ⚠️ Beta verzija |
| **Auth Adapter:** @auth/prisma-adapter | 2.6.0 | ✅ Najnovija |
| **Hashing:** bcryptjs | 2.4.3 | ✅ Najnovija |
| **HTTP Client:** Axios | 1.11.0 | ✅ Najnovija |
| **Cache:** Upstash Redis | 1.34.8 | ✅ Najnovija |
| **Email:** Resend | 4.0.0 | ✅ Najnovija |
| **Debouncing:** use-debounce | 10.0.4 | ✅ Najnovija |

### Obrada Fajlova
| Paket | Verzija | Status |
|-------|---------|--------|
| **Excel:** ExcelJS | 4.4.0 | ✅ Najnovija |
| **Excel:** XLSX | 0.18.5 | ✅ Najnovija |
| **CSV:** Papaparse | 5.5.3 | ✅ Najnovija |
| **CSV:** csv-parser | 3.2.0 | ✅ Najnovija |
| **CSV Export:** React CSV | 2.2.2 | ✅ Najnovija |
| **Encoding:** quoted-printable | 1.0.1 | ✅ Najnovija |

### AI & Automatizacija
| Paket | Verzija | Status |
|-------|---------|--------|
| **MCP SDK:** @modelcontextprotocol/sdk | 1.18.1 | ✅ Najnovija |
| **LLM:** OpenAI | 5.20.0 | ![Update](https://img.shields.io/badge/update-available-orange) |
| **Cron Jobs:** - | Custom | Praćenje isteka ugovora |

### Alati za Razvoj
| Paket | Verzija | Status |
|-------|---------|--------|
| **Jezik:** TypeScript | 5.x | ✅ Najnovija |
| **Linting:** ESLint | 8.x | ✅ Stabilna |
| **CSS:** PostCSS | 8.x | ✅ Najnovija |
| **Test Data:** @faker-js/faker | 9.7.0 | ✅ Najnovija |
| **Seeding:** ts-node | 10.9.2 | ✅ Najnovija |
| **Env:** dotenv | 17.2.1 | ✅ Najnovija |
| **Utils:** uuid | 10.0.0 | ✅ Najnovija |
| **Utils:** clsx | 2.1.1 | ✅ Najnovija |
| **Utils:** CVA | 0.7.0 | ✅ Najnovija |
| **Utils:** tailwind-merge | 2.5.3 | ✅ Najnovija |

### DevOps & Deploy
- **Deploy:** Vercel-optimizovan / Docker-ready
- **Kontrola Verzija:** Git
- **Migracije Baze:** Prisma Migrate
- **Package Manager:** npm/yarn/pnpm
- **Build Tool:** Next.js built-in
- **CI/CD:** GitHub Actions ready

---

## 📊 Package Update Badge Legend

- ✅ **Najnovija** - Trenutno koristiš najnoviju stabilnu verziju
- ![Update](https://img.shields.io/badge/update-available-orange) **Update dostupan** - Nova verzija je dostupna
- ![Major](https://img.shields.io/badge/major-update-red) **Major update** - Breaking changes mogu postojati
- ⚠️ **Beta/RC** - Pre-release verzija u upotrebi

---

## 🔄 Komande za Update

```bash
# Proveri koje pakete možeš update-ovati
npm run check-updates

# Interaktivno izaberi pakete za update
npm run check-updates:interactive

# Update sve pakete odjednom (pažljivo!)
npm run update-all

# Vidi koje pakete npm preporučuje za update
npm run outdated

# Update samo produkcijske dependencies
npx npm-check-updates -u --target minor

# Update dev dependencies
npx npm-check-updates -u --target minor --dep dev

# Update specifičan paket
npm install <package>@latest
```

---

## ⚠️ Napomene o Verzijama

- **Next.js 15.3.3**: Trenutno stabilna verzija, 15.5.4 je dostupna
- **NextAuth.js v5**: Beta verzija - može biti nestabilna
- **Lucide React**: Brza frekvencija update-a, proveri changelog
- **OpenAI SDK**: API breaking changes mogu nastati


---

## 🏗 Arhitektura Projekta

### Struktura Foldera



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


---

## 🎯 Osnovni Moduli

### 1. **Upravljanje Ugovorima** (`/contracts`)

**Svrha:** Upravljanje ugovorima sa providerima, parking servisima i humanitarnim organizacijama.

**Funkcionalnosti:**
- ✅ CRUD operacije za ugovore
- ✅ Praćenje roka važenja ugovora
- ✅ Automatske notifikacije za ugovore koji ističu
- ✅ Upload attachment-a (PDF, Word, Excel)
- ✅ Workflow obnove ugovora
- ✅ Timeline vizualizacija
- ✅ Status ugovora (Draft, Active, Expiring, Expired)

**Ključni Fajlovi:**
- `app/(protected)/contracts/page.tsx` - Lista ugovora
- `app/api/contracts/route.ts` - CRUD API
- `actions/contracts/create.ts` - Server action za kreiranje
- `lib/contracts/expiration-checker.ts` - Provera isteka

**Tabele u Bazi:**
- `Contract` - Osnovni podaci o ugovoru
- `ContractAttachment` - Attachments
- `ContractReminder` - Podsetnici

---

### 2. **Humanitarne Organizacije** (`/humanitarian-orgs`)

**Svrha:** Upravljanje humanitarnim organizacijama i njihovim uslugama.

**Funkcionalnosti:**
- ✅ Registracija humanitarnih organizacija
- ✅ Praćenje kratkog broja (shortNumber)
- ✅ Povezivanje sa uslugama (SMS, Voice)
- ✅ Generisanje mesečnih izveštaja
- ✅ Upload izveštaja (Excel)
- ✅ Proces obnove

**Ključni Fajlovi:**
- `app/(protected)/humanitarian-orgs/page.tsx`
- `app/api/humanitarian-orgs/route.ts`
- `actions/humanitarian-orgs/create.ts`
- `components/humanitarian-orgs/HumanitarianOrgForm.tsx`

**Tabele u Bazi:**
- `HumanitarianOrg` - Organizacije
- `HumanitarianService` - Usluge (SMS/Voice)
- `HumanitarianRenewal` - Renewal zahtevi

---

### 3. **Parking Servisi** (`/parking-services`)

**Svrha:** Upravljanje parking uslugama i pratećim ugovorima.

**Funkcionalnosti:**
- ✅ Registracija parking servisa
- ✅ Praćenje ugovora po parking servisu
- ✅ Generisanje izveštaja
- ✅ Import podataka iz Excel-a
- ✅ Statistika prihoda

**Ključni Fajlovi:**
- `app/(protected)/parking-services/page.tsx`
- `app/api/parking-services/route.ts`
- `actions/parking-services/create.ts`
- `lib/parking-services/validators.ts`

**Tabele u Bazi:**
- `ParkingService` - Parking servisi
- `ParkingContract` - Ugovori

---

### 4. **Upravljanje Providerima** (`/providers`)

**Svrha:** Upravljanje telekom providerima (Telekom, Telenor, A1, Globaltel).

**Funkcionalnosti:**
- ✅ CRUD operacije za providere
- ✅ Praćenje aktivnih/neaktivnih providera
- ✅ Povezivanje sa uslugama (VAS, Bulk SMS)
- ✅ Ugovori po provideru
- ✅ Import VAS usluga

**Ključni Fajlovi:**
- `app/(protected)/providers/page.tsx`
- `app/api/providers/route.ts`
- `actions/providers/create.ts`
- `components/providers/ProviderForm.tsx`

**Tabele u Bazi:**
- `Provider` - Provideri
- `ProviderContract` - Ugovori sa providerima

---

### 5. **Upravljanje Uslugama** (`/services`)

**Svrha:** Upravljanje svim vrstama usluga (VAS, Bulk SMS, Humanitarian, Parking).

**Funkcionalnosti:**
- ✅ Multi-kategorija sistem (VAS, BULK, HUMANITARIAN, PARKING)
- ✅ Import iz Excel/CSV
- ✅ Bulk operacije
- ✅ Statistika po kategorijama
- ✅ Filter i search

**Ključni Fajlovi:**
- `app/(protected)/services/page.tsx`
- `app/api/services/route.ts`
- `actions/services/create.ts`
- `lib/services/csv-processor.ts`

**Tabele u Bazi:**
- `Service` - Sve usluge (VAS, Bulk, itd.)
- `VasService` - VAS specifični podaci
- `BulkService` - Bulk SMS specifični podaci

---

### 6. **Izveštaji** (`/reports`)

**Svrha:** Generisanje i pregled detaljnih izveštaja za sve module.

**Funkcionalnosti:**
- ✅ Export PDF/CSV/XLSX
- ✅ Filtriranje po provajderu, ugovoru, organizaciji
- ✅ Automatski generisani monthly reports
- ✅ Dashboard pregled
- ✅ Download izveštaja

**Ključni Fajlovi:**
- `app/(protected)/reports/page.tsx`
- `app/api/reports/route.ts`
- `lib/reports/report-generator.ts`

---

### 7. **AI Integracija (MCP)**

**Svrha:** Automatska obrada email-a, ekstrakcija podataka i analiza ugovora.

**Funkcionalnosti:**
- ✅ Obrada email prepiske
- ✅ Ekstrakcija relevantnih podataka (cena, datum, ime servisa, broj telefona)
- ✅ Upis u bazu
- ✅ Pretraga i filtriranje putem MCP upita
- ✅ Predikcija i sugestije za renewals

**Ključni Fajlovi:**
- `lib/mcp/handleAIQuery.ts`
- `actions/mcp/processEmail.ts`
- `lib/email-utils.ts`

---

## 🔒 Autentifikacija i Sigurnost

- **NextAuth.js v5**
- **Session-based autentifikacija**
- **Roles:** Admin, User
- **Middleware** za zaštitu ruta
- **Bcryptjs** za lozinke
- **Prisma Adapter** za bazu

---

## ⚡ Sistemi Upload i Import Fajlova

- **Excel:** XLSX, ExcelJS
- **CSV:** Papaparse, csv-parser
- **Folder struktura:** Upload folder unutar `/public/reports/` za privremene fajlove
- **Server Actions** za obradu fajlova i upis u bazu
- **Validacija** putem Zod shema

---

## 📊 Sistemi Izveštavanja

- Pregled ugovora i organizacija
- Filter po datumima, providerima, statusu ugovora
- Export u PDF/CSV/XLSX
- Automatsko generisanje mesečnih izveštaja

---

## 🚀 Deploy

- **Vercel:** automatski build i deploy
- **Docker-ready:** za lokalni i cloud deploy
- **Environment variables:** `.env` fajl sa Prisma, NextAuth, MCP i email konfiguracijom
- **CI/CD:** GitHub Actions (preporuka)

---

## ✨ Napomene

- Sve imena foldera i fajlova su ostavljena neprevodjena radi konzistentnosti.
- MCP AI modul može da se poveže sa lokalnim ili cloud LLM modelom.
- Sistem je modularan i lako proširiv sa novim providerima ili tipovima usluga.


## 📈 Optimizacija Performansi
- Indeksi i optimizovane upite u bazi
- Caching (client-side i server-side)
- Code splitting i optimizacija slika
- Analiza veličine bundle-a

---

## 🧪 Testiranje
- Unit testovi za proveru funkcionalnosti
- Integration testovi za API rute

---

## 👥 Contributing
- Feature branch workflow
- Pokretanje testova
- Code style i JSDoc komentari

---

## 📄 License
Proprietary - All rights reserved

---

## 📞 Support
**Email:** support@tres-system.com  
**Dokumentacija:** https://docs.tres-system.com  
**GitHub Issues:** https://github.com/your-org/tres

---

**Poslednje Ažuriranje:** Oktobar 2025  
**Verzija:** 1.0.0  
**Održava:** TRES Development Team
