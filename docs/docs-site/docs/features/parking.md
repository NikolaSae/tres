---
id: parking
title: Parking Servisi
sidebar_label: 🅿️ Parking Servisi
---

# Parking Servisi

TRES upravlja SMS parking uslugama za gradove širom Srbije. Građani plaćaju parking putem SMS-a na kratki broj, a TRES prati prihode i izveštaje.

## Šta su parking servisi?

Parking servisi su gradske/opštinske organizacije koje upravljaju javnim parkiralištima. TRES prati:
- Registraciju parking servisa po gradu
- Mesečne prihode od SMS plaćanja
- Automatsko generisanje i slanje izveštaja
- Import transakcionalnih podataka

## Pokriveni gradovi

TRES trenutno pokriva **85+ gradova i opština** u Srbiji, uključujući:
Beograd, Novi Sad, Niš, Kragujevac, Subotica, Zrenjanin, Pančevo, Čačak, Kruševac, Leskovac i mnoge druge.

## Kreiranje parking servisa

1. **Parking Services → New**
2. Unesi:
   - Naziv servisa i grad
   - Kratki broj za SMS plaćanje
   - Kontakt email (za slanje izveštaja)
   - Ugovoreni procenat prihoda
3. Poveži sa ugovorom
4. **Create**

## Import podataka

Parking transakcioni podaci se importuju iz Excel fajlova:

### Standard import
```
Parking Services → [Servis] → Import → Upload .xlsx
```

### TypeScript streaming import
Za velike fajlove (100k+ redova) dostupan je streaming import:
```
POST /api/parking-services/typescript-import-stream
```

### Python procesori
Za naprednu obradu koriste se Python skripte u `scripts/`:
- `parking_service_processor.py` — obrađuje CSV/Excel iz parking sistema
- `vas_provider_processor.py` — obrađuje VAS podatke od provajdera

## Izveštaji

### Generisanje izveštaja

Parking izveštaji se generišu automatski na kraju svakog meseca i ručno po potrebi:

```
Reports → Parking → Generate → Izaberi servis i period
```

Izveštaji se čuvaju u:
```
public/parking-service/{grad}/report/
```

### Slanje izveštaja emailom

1. **Parking Services → [Servis] → Reports**
2. Izaberi fajl
3. **Send via Email** — šalje na konfigurisani email servisa

TRES podržava slanje putem Outlook-a (lokalni SMTP):
```typescript
// lib/email/outlook-smtp.ts
// Konfiguracija za integraciju sa Outlook
```

### Email Activity Log

Svaki poslati izveštaj se loguje u **Email Activity Log** koji prikazuje:
- Datum slanja
- Primaoce
- Status dostave
- Priložene fajlove

## Statistike

### Po parking servisu
- Ukupan prihod u periodu
- Prosečni dnevni prihod
- Broj transakcija
- Trend po mesecima

### Globalne statistike
- Suma svih parking prihoda
- Top 10 servisa po prihodu
- Pokrivenost po regionima

## API endpoints

| Method | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/parking-services` | Lista servisa |
| POST | `/api/parking-services` | Novi servis |
| GET | `/api/parking-services/[id]` | Detalji |
| POST | `/api/parking-services/[id]/upload` | Upload podataka |
| GET | `/api/parking-services/[id]/reports` | Izveštaji servisa |
| POST | `/api/parking-services/typescript-import` | Import |
| POST | `/api/parking-services/typescript-import-stream` | Streaming import |
| POST | `/api/parking-services/rename-file` | Preimenovanje fajla |

## Server Actions

```typescript
import { getAllParkingServices } from "@/actions/parking-services/getAllParkingServices";
import { getParkingServiceStats } from "@/actions/parking-services/getParkingServiceStats";
import { getMonthlyRevenueStats } from "@/actions/parking-services/getMonthlyRevenueStats";
import { getTotalParkingRevenue } from "@/actions/parking-services/getTotalParkingRevenue";
```