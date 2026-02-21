---
id: first-steps
title: Prvi Koraci
sidebar_label: Prvi Koraci
---

# Prvi Koraci

Nakon uspešne instalacije, evo kako da počneš da koristiš TRES.

## Navigacija

Aplikacija ima bočni meni (sidebar) sa svim modulima:

```
Dashboard
├── Contracts        — Upravljanje ugovorima
├── Providers        — Telekom provideri
├── Services         — VAS / Bulk usluge
├── Humanitarian Orgs — Humanitarne organizacije
├── Parking Services — Parking servisi
├── Complaints       — Prigovori korisnika
├── Reports          — Generisanje izveštaja
├── Analytics        — Dashboard i metrike
├── Notifications    — Obaveštenja
└── Admin            — Administracija (samo admini)
```

## Kreiranje prvog ugovora

1. Klikni na **Contracts** u levom meniju
2. Klikni dugme **+ New Contract**
3. Izaberi tip ugovora:
   - **Provider Contract** — ugovor sa telekom provajderom
   - **Humanitarian** — ugovor sa humanitarnom organizacijom
   - **Parking** — ugovor sa parking servisom
4. Popuni obavezna polja i klikni **Create**

## Dodavanje providera

Provajderi su osnova sistema — ugovori i usluge se vezuju za njih.

1. Idi na **Providers → New Provider**
2. Unesi naziv, PIB i kontakt podatke
3. Upload logoa (opciono)
4. Sačuvaj

## Import podataka

Ako imaš postojeće podatke u Excel-u, možeš ih importovati:

1. Idi na modul (npr. **Services**)
2. Klikni **Import**
3. Upload `.xlsx` fajl
4. Proveri preview podataka
5. Potvrdi import

Podržani formati: `.xlsx`, `.csv`

## Praćenje isteka ugovora

Sistem automatski prati ugovore koji ističu i šalje email obaveštenja.

Da bi video ugovore koji ističu:

1. Idi na **Contracts → Expiring**
2. Filtriraj po broju dana (30 / 60 / 90 dana)
3. Klikni na ugovor za detalje i pokretanje renewal procesa

## Dashboard

Dashboard (`/dashboard`) prikazuje:

- Broj aktivnih ugovora
- Ugovori koji ističu u narednih 30 dana
- Poslednji prigovori
- Prihodi po mesecima
- Quick actions

## Sledeći koraci

- [Ugovori →](../features/contracts) — Detaljno o upravljanju ugovorima
- [Analitika →](../features/analytics) — Razumevanje metrika
- [Import/Export →](../import-export/excel-import) — Rad sa Excel fajlovima