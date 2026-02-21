---
id: intro
slug: /
title: TRES — Telco Regulation & Expense System
sidebar_label: Uvod
---

# TRES — Telco Regulation & Expense System

**TRES** je sveobuhvatna web platforma za upravljanje telekomunikacionim uslugama, ugovorima, humanitarnim organizacijama i parking servisima u Srbiji.

## Šta je TRES?

TRES omogućava kompanijama u telekomunikacionom sektoru da centralizovano prate i upravljaju:

- **Ugovorima** sa providerima, humanitarnim organizacijama i parking servisima
- **VAS (Value Added Services)** i Bulk SMS uslugama
- **Prigovorima (Complaints)** korisnika sa punim workflow-om
- **Izveštajima** — automatsko generisanje Excel/PDF izveštaja
- **Finansijskom analitikom** — prihodi, predikcije, anomalije

## Ključne prednosti

| Funkcionalnost | Opis |
|---|---|
| 📋 Upravljanje ugovorima | Praćenje isteka, upload attachmenta, workflow obnove |
| 🏢 Humanitarne organizacije | Kratki brojevi, SMS/Voice usluge, mesečni izveštaji |
| 🅿️ Parking servisi | Prihodi po gradu, import iz Excel-a, automatski izveštaji |
| 📡 Telekom provideri | VAS/Bulk usluge, linking sa ugovorima |
| 📊 Analitika | Real-time dashboard, anomaly detection, KPI metrike |
| 🤖 AI integracija | Chat sa bazom, obrada email-a, MCP podrška |
| 🔒 Sigurnost | RBAC, audit logovi, rate limiting, 2FA |

## Tech stack

TRES je izgrađen na modernom stack-u:

- **Frontend:** Next.js 15, React 19, Tailwind CSS, shadcn/ui
- **Backend:** Next.js Server Actions + API Routes
- **Baza podataka:** PostgreSQL (Supabase) + Prisma ORM
- **Autentifikacija:** NextAuth.js v5
- **Cache:** Upstash Redis
- **AI:** OpenAI + MCP SDK
- **Email:** Resend + Nodemailer

## Brzi start

```bash
git clone https://github.com/NikolaSae/tres.git
cd tres
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

Otvori `http://localhost:3000` u browseru.

---

Odaberi sekciju u levoj navigaciji da počneš.