# Project Documentation – Complete App + API

Ova dokumentacija daje hijerarhijski pregled projekta, sa opisom foldera, fajlova i njihove funkcionalnosti.

---

## 1. App Folder – Frontend (React + Next.js 15+)

`app/(protected)` – Zaštićeni deo aplikacije, dostupan samo prijavljenim korisnicima.

### Global Components
- `_components/` – Reusable UI komponente
  - `floating-chat-button.tsx` – plutajući chat button
  - `navbar.tsx` – glavna navigacija
  - `newbar.tsx` – sekundarna navigacija
  - `sidebar.tsx` – sidebar meniji

### Admin
- `admin/aidash` – Admin dashboard
  - `actions/` – logika za dashboard akcije
  - `components/` – komponente dashboarda (AnalyticsPanel, ChatInterface, StatCard...)
- `admin/complaints` – administracija reklamacija
- `admin/notifications` – notifikacije admina
- `admin/security` – korisnici i sigurnost
- `admin/page.tsx` – glavna admin stranica

### Analytics
- `analytics/` – Izveštaji i statistike
  - `complaints/` – statistike reklamacija
  - `financials/` – finansijski izveštaji
  - `providers/` – statistike provajdera
  - `sales/` – prodajni izveštaji

### Audit Logs
- `audit-logs/` – pregled sistemskih logova

### Services
- `bulk-services/` – Bulk servisi (pregled, novi, edit, import)
- `services/` – Ostali servisi (VAS, humanitarni, parking)
- `parking-services/` – Parking servisi
- `products/` – Proizvodi
- `providers/` – Provajderi
- `operators/` – Operateri
- `humanitarian-orgs/` – Humanitarne organizacije
- `humanitarian-renewals/` – Obnove ugovora humanitarnih org.
- `contracts/` – Ugovori (pregled, edit, novi, expiring)
- `reports/` – Generisanje i pregled izveštaja
- `dashboard/` – glavna početna stranica
- `settings/` – korisničke i sistemske postavke
- `notifications/` – pregled i podešavanja notifikacija
- `client/` – klijentski deo (ako postoji razlika od admina)
- `chat/` – interni chat sistem

### Auth
- `auth/` – autentifikacija korisnika
  - `login/` – login stranica
  - `register/` – registracija
  - `reset/` – reset lozinke
  - `new-password/` – postavljanje nove lozinke
  - `new-verification/` – verifikacija korisnika
  - `error/` – prikaz grešaka
  - `layout.tsx` – zajednički layout za auth stranice

### Fonts & Assets
- `fonts/` – fontovi projekta
- `globals.css` – globalni CSS
- `icon.png` – favicon

### Error Pages
- `403/page.tsx` – stranica zabranjen pristup
- `404/page.tsx` – stranica nije pronađena

---

## 2. API Folder – Backend (Next.js API Routes)

`app/api/` – server-side logika, konekcija sa bazom i import/export podataka

### Admin
- `admin/mcp` – MCP rute (logs, stats, users, search-humanitarian-orgs)
- `route.ts` – glavna admin API ruta

### Analytics
- `analytics/financials/route.ts` – finansijski izveštaji
- `analytics/sales/route.ts` – izveštaji prodaje

### Auth
- `[...nextauth]/route.ts` – login/register i autentifikacija

### Blacklist
- `blacklist/route.ts` – blok lista korisnika/entiteta

### Bulk Services
- `[id]/route.ts` – pojedinačni bulk servis
- `export/route.ts` – export bulk podataka
- `import/route.ts` – import bulk podataka
- `route.ts` – lista bulk servisa

### Chat
- `database/route.ts` – rad sa chat bazom
- `database-simple/route.ts` – pojednostavljena baza
- `route.ts` – chat funkcionalnosti

### Complaints
- `[id]/attachments/route.ts` – attachmenti reklamacija
- `[id]/comments/route.ts` – komentari reklamacija
- `[id]/status/route.ts` – status reklamacije
- `[id]/route.ts` – pojedinačna reklamacija
- `export/route.ts` – export reklamacija
- `statistics/route.ts` – statistike reklamacija
- `route.ts` – lista reklamacija

### Contracts
- `[id]/attachments/route.ts` – attachmenti ugovora
- `[id]/edit/route.ts` – edit ugovora
- `[id]/reminders/route.ts` – podsetnici ugovora
- `[id]/renewal/...` – rute za obnavljanje ugovora
- `[id]/services/route.ts` – servisi ugovora
- `[id]/status/route.ts` – status ugovora
- `[id]/route.ts` – pojedinačni ugovor
- `expiring/route.ts` – ugovori koji ističu
- `export/route.ts` – export ugovora
- `statistics/expiry/route.ts` – statistike isteka
- `timeline/expiry/route.ts` – vremenska linija ugovora
- `route.ts` – lista ugovora

### Cron
- `check-expiring/route.ts` – cron zadatak za proveru ugovora

### Humanitarian Orgs
- `[id]/contracts/route.ts` – ugovori humanitarnih organizacija
- `[id]/services/route.ts` – servisi humanitarnih organizacija
- `[id]/route.ts` – pojedinačna organizacija
- `route.ts` – lista organizacija

### Humanitarian Renewals
- `[id]/route.ts` – pojedinačna obnova
- `statistics/route.ts` – statistike obnova
- `route.ts` – lista obnova

### Notifications
- `email/route.ts` – slanje email notifikacija
- `push/route.ts` – push notifikacije
- `route.ts` – pregled i upravljanje notifikacijama

### Operators
- `[id]/contracts/route.ts` – ugovori operatera
- `[id]/route.ts` – pojedinačni operater
- `contracts/route.ts` – ugovori svih operatera
- `route.ts` – lista operatera

### Organizations
- `by-kratki-broj/[kratkiBroj]/route.ts` – dohvatanje organizacija po kratkom broju

### Parking Services
- `[id]/contracts/route.ts` – ugovori parking servisa
- `[id]/reports/route.ts` – izveštaji parking servisa
- `[id]/services/route.ts` – servisi parking servisa
- `[id]/route.ts` – pojedinačni parking servis
- `parking-import/route.ts` – import podataka
- `rename-file/route.ts` – preimenovanje fajlova
- `typescript-import/route.ts` – TS import
- `typescript-import-stream/route.ts` – stream import
- `upload/route.ts` – upload fajlova

### Products
- `[id]/route.ts` – pojedinačni proizvod

### Providers
- `[id]/bulk-services/route.ts` – bulk servisi provajdera
- `[id]/contracts/route.ts` – ugovori provajdera
- `[id]/edit/route.ts` – edit provajdera
- `[id]/renwe-contract/route.ts` – obnova ugovora
- `[id]/status/route.ts` – status provajdera
- `[id]/vas-services/route.ts` – VAS servisi
- `[id]/route.ts` – pojedinačni provajder
- `by-name/[name]/route.ts` – pretraga po imenu
- `upload/route.ts` – upload provajdera
- `vas-import/route.ts` – import VAS servisa

### Reports
- `generate/route.ts` – generisanje izveštaja
- `scan-unified/route.ts` – scan sistema
- `upload-humanitarian/route.ts` – upload humanitarnih izveštaja
- `upload-parking/route.ts` – upload parking izveštaja
- `upload-provider/route.ts` – upload provajdera
- `validate-system/route.ts` – validacija sistema
- `route.ts` – lista svih izveštaja

### Security
- `logs/route.ts` – sigurnosni logovi
- `performance/route.ts` – performanse sistema
- `performance/summary/route.ts` – sumarni prikaz
- `permissions/route.ts` – upravljanje permisijama

### Sender Blacklist
- `route.ts` – crna lista pošiljalaca

### Services
- `[id]/route.ts` – pojedinačni servis
- `bulk/[bulkId]/route.ts` – bulk servis
- `humanitarian/[orgId]/route.ts` – humanitarni servis
- `parking/[parkingId]/route.ts` – parking servis
- `categories/route.ts` – kategorije servisa
- `import/route.ts` – import servisa
- `route.ts` – lista svih servisa

### Test
- `route.ts` – test API ruta

### Users
- `[id]/route.ts` – pojedinačni korisnik
- `route.ts` – lista svih korisnika

### VAS Services
- `postpaid-import-stream/route.ts` – postpaid import
- `upload/route.ts` – upload VAS servisa
