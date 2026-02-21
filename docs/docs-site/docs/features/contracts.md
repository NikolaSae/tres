---
id: contracts
title: Upravljanje Ugovorima
sidebar_label: 📋 Ugovori
---

# Upravljanje Ugovorima

Modul za upravljanje ugovorima je centralna funkcionalnost TRES-a. Omogućava kreiranje, praćenje i upravljanje svim vrstama ugovora.

## Tipovi ugovora

TRES podržava tri tipa ugovora:

### Provider Contract
Ugovori sa telekom provajderima (Telekom, Telenor, A1, Globaltel) za VAS i Bulk SMS usluge.

### Humanitarian Contract
Ugovori sa humanitarnim organizacijama koje prikupljaju donacije putem kratkih brojeva.

### Parking Contract
Ugovori sa parking servisima širom Srbije za SMS parking usluge.

## Životni ciklus ugovora

```
DRAFT → ACTIVE → RENEWAL → EXPIRED
              ↓
           TERMINATED
```

| Status | Opis |
|--------|------|
| `DRAFT` | Ugovor je kreiran ali nije aktivan |
| `ACTIVE` | Ugovor je važeći |
| `RENEWAL` | Pokrenut proces obnove |
| `EXPIRED` | Ugovor je istekao |
| `TERMINATED` | Ugovor je raskinut |

## Kreiranje ugovora

### Putem UI-a

1. **Contracts → New Contract**
2. Izaberi tip: Provider / Humanitarian / Parking
3. Unesi podatke:
   - Naziv ugovora
   - Datum početka i isteka
   - Provajder / organizacija
   - Iznos i valuta
   - Usluge koje su pokrivene ugovorom
4. Upload attachmenta (PDF, Word, Excel — max 10MB)
5. Klikni **Create Contract**

### Putem Import-a

Masovni import ugovora iz Excel fajla:

```
Contracts → Import → Upload .xlsx
```

## Praćenje isteka

Sistem automatski prati ugovore koji ističu i:

- Šalje email notifikacije **30, 14 i 7 dana** pre isteka
- Prikazuje upozorenje na dashboard-u
- Boji ugovor narandžasto/crveno u listi

### Expiring Contracts stranica

`Contracts → Expiring` prikazuje sve ugovore koji ističu u narednom periodu sa filterom po broju dana.

## Attachmenti

Svaki ugovor može imati više attachmenta:

- Podržani formati: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG
- Maksimalna veličina: 10MB po fajlu
- Fajlovi se čuvaju u `public/uploads/contracts/`

## Reminders (Podsetnici)

Možeš kreirati custom podsetnik za bilo koji ugovor:

1. Otvori ugovor
2. **Reminders → Create Reminder**
3. Unesi datum i poruku
4. Sistem šalje email na taj datum

## Linking usluga sa ugovorom

Usluge (VAS, Bulk, Humanitarian) se mogu vezati za specifičan ugovor:

1. Otvori ugovor
2. Tab **Services**
3. **Link Service → Izaberi uslugu**

## Revenue kalkulacija

Za svaki ugovor sistem može izračunati očekivani prihod na osnovu:
- Fiksnog iznosa iz ugovora
- Procenta od prihoda usluga
- Mesečnih transakcionih podataka

## API endpoints

| Method | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/contracts` | Lista svih ugovora |
| POST | `/api/contracts` | Kreiranje novog |
| GET | `/api/contracts/[id]` | Detalji ugovora |
| PUT | `/api/contracts/[id]` | Ažuriranje |
| DELETE | `/api/contracts/[id]` | Brisanje |
| GET | `/api/contracts/expiring` | Ugovori koji ističu |
| GET | `/api/contracts/statistics` | Statistike |
| POST | `/api/contracts/[id]/attachments` | Upload attachmenta |

## Server Actions

```typescript
import { createContract } from "@/actions/contracts/create";
import { updateContract } from "@/actions/contracts/update";
import { deleteContract } from "@/actions/contracts/delete";
import { checkExpiring } from "@/actions/contracts/check-expiring";
```