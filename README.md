# VAS / Bulk / Humanitarian Management App
Full-stack Next.js 15+ aplikacija za upravljanje ugovorima, servisima, humanitarnim organizacijama i analizom podataka.
## Tech Stack
- **Frontend**: Next.js 15+ (App Router), React 18+, Tailwind CSS
- **Backend**: Next.js API routes (Edge Functions za optimizovane rute)
- **Authentication**: NextAuth v5 + Prisma Adapter
- **Database**: PostgreSQL (Neon.tech)
- **ORM**: Prisma
- **Other Tools**: Excel/XLSX processing, Email parsing, PDF/CSV export
## Features
- CRUD ugovora (VAS, Bulk, Parking, Humanitarian)
- Upravljanje provajderima i operatorima
- Detaljna statistika i analitika (complaints, financials, sales)
- Admin panel sa security logs, user roles i notifications
- Upload i ekstrakcija podataka iz XLS/XLSX i emaila
- Reports (generate, scheduled, provider, parking, humanitarian)
- Chat interface za podršku i internu komunikaciju
## Setup

1. Clone repo:
   git clone https://github.com/username/project.git
2. Instaliraj dependencies:
   npm install
3. Kreiraj `.env` fajl:
   - DATABASE_URL="postgresql://..."
   - NEXTAUTH_SECRET="..."
   - OTHER_KEYS=...
4. Pokreni lokalno:
   npm run dev
5. Aplikacija dostupna na:
   http://localhost:3000

## Project Structure
- `app/` → frontend i page route-ovi
- `app/api/` → backend API rute
- `scripts/` → pomoćne skripte (import, eksport, migracije)
- `public/` → statički fajlovi
- `PROJECT_STRUCTURE.md` → hijerarhija fajlova
- `PROJECT_DOCUMENTATION.md` → detaljna dokumentacija projekta
- `README.md` → ovaj fajl

## Deployment
- Može se deployovati na Vercel, Netlify ili lokalni server
- Edge Functions i Server Actions optimizovani za performanse
- `.env` fajl mora biti podešen sa istim ključevima kao lokalno

## Contributing
- Ažuriraj `PROJECT_STRUCTURE.md` i `PROJECT_DOCUMENTATION.md` pre mergovanja novih funkcionalnosti
- Koristi standardni Git workflow (feature branch, PR, code review)
- Održavaj kod čistim i modularnim

## Documentation
- `PROJECT_STRUCTURE.md` → brz pregled svih foldera i fajlova
- `PROJECT_DOCUMENTATION.md` → detaljni opisi funkcionalnosti, API-ja i stranica
- API dokumentacija se može generisati dodatno kroz Postman ili Swagger ako je potrebno
