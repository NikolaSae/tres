---
id: complaints
title: Prigovori Korisnika
sidebar_label: 📝 Prigovori
---

# Prigovori Korisnika (Complaints)

Kompletan sistem za upravljanje prigovorima korisnika telekomunikacionih usluga sa workflow-om, dodeljivanjem i praćenjem statusa.

## Šta su prigovori?

Prigovori su zvanični zahtevi korisnika koji se žale na probleme sa uslugama (neželjene SMS poruke, netačno naplaćivanje, itd.). TRES prati celokupan životni ciklus svakog prigovora.

## Životni ciklus prigovora

```
OPEN → IN_PROGRESS → RESOLVED
     ↓            ↓
  ESCALATED    CLOSED (bez rešenja)
```

| Status | Opis |
|--------|------|
| `OPEN` | Prigovor primljen, nije dodeljen |
| `IN_PROGRESS` | Dodeljen operateru, u obradi |
| `ESCALATED` | Eskaliran menadžmentu |
| `RESOLVED` | Rešen sa zaključkom |
| `CLOSED` | Zatvoren |

## Kreiranje prigovora

### Ručno kreiranje

1. **Complaints → New**
2. Unesi:
   - Podnosilac (ime, telefon, email)
   - Provajder na koji se žali
   - Tip prigovora (VAS / Parking / Humanitarno)
   - Opis problema
   - Iznos (ako je finansijski prigovor)
3. Upload priloženih dokumenata
4. **Submit**

### Import iz CSV/Excel

Masovni import prigovora:

```
Complaints → Import CSV
```

Format CSV fajla:
```
ime,prezime,telefon,email,provider,opis,iznos,datum
```

## Dodeljivanje prigovora

Admin ili supervizor dodeljuje prigovor operateru:

1. Otvori prigovor
2. **Assign → Izaberi korisnika**
3. Korisnik dobija email notifikaciju

Automatsko dodeljivanje po round-robin algoritmu je opcija u `actions/complaints/assign.ts`.

## Komentari i komunikacija

Na svakom prigovoru dostupna je sekcija za komentare:
- Interni komentari (vidljivi samo zaposlenima)
- Komentari za korisnike
- Timeline promene statusa

## Finansijski prigovori

Ako prigovor uključuje finansijsku naknadu:
- Unesi iznos prigovora
- Sistem prati ukupan iznos po provajderu
- Dostupna je statistika po periodu

## Blacklist

Sistem ima blacklist za pošiljaoce koji zloupotrebljavaju sistem prigovora:

```
Admin → Blacklist → Add Sender
```

Blacklisted pošiljaoci su automatski odbijeni pri novim prigovorima.

## Export

Prigovori se mogu exportovati za izveštaje:

```
Complaints → Export → Izaberi period → Excel / CSV
```

## Analitika prigovora

Dashboard analitike (`Analytics → Complaints`) prikazuje:
- Broj prigovora po statusu (grafikon)
- Prigovori po provajderu
- Trend po mesecima
- Prosečno vreme rešavanja
- Prigovori po kategoriji usluge

## API endpoints

| Method | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/complaints` | Lista prigovora |
| POST | `/api/complaints` | Novi prigovor |
| GET | `/api/complaints/[id]` | Detalji |
| PUT | `/api/complaints/[id]` | Ažuriranje |
| POST | `/api/complaints/[id]/assign` | Dodeljivanje |
| POST | `/api/complaints/[id]/comment` | Dodaj komentar |
| GET | `/api/complaints/statistics` | Statistike |
| GET | `/api/complaints/export` | Export |

## Server Actions

```typescript
import { createComplaint } from "@/actions/complaints/create";
import { assignComplaint } from "@/actions/complaints/assign";
import { changeStatus } from "@/actions/complaints/change-status";
import { addComment } from "@/actions/complaints/comment";
```