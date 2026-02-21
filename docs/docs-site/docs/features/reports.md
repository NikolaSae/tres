---
id: reports
title: Izveštaji
sidebar_label: 📊 Izveštaji
---

# Izveštaji

TRES ima sveobuhvatan sistem za generisanje, upload, pregled i slanje izveštaja u Excel i PDF formatima.

## Tipovi izveštaja

| Tip | Opis | Format |
|-----|------|--------|
| Humanitarian | Mesečni izveštaj za org. | Excel |
| Parking | Mesečni prihodi parking servisa | Excel |
| Provider | VAS prihodi po provajderu | Excel |
| Contracts | Statistike ugovora | Excel / PDF |
| Complaints | Prigovori u periodu | Excel / CSV |

## Generisanje izveštaja

### Ručno generisanje

```
Reports → Generate
```

1. Izaberi tip izveštaja
2. Postavi period (od - do)
3. Izaberi specifičan entitet (provajder, org, servis)
4. Klikni **Generate**
5. Download ili direktno pošalji emailom

### Automatsko generisanje

Sistem automatski generiše mesečne izveštaje na kraju svakog meseca putem cron job-a:

```
/api/cron/check-expiring — pokreće se svaki dan u 9:00
```

## Struktura fajlova

Izveštaji se čuvaju po sledećoj strukturi:

```
public/
├── reports/
│   ├── {kratki-broj} - {naziv org}/
│   │   ├── 2025/
│   │   │   ├── 08/
│   │   │   └── 09/
│   │   └── 2026/
│   ├── prepaid/
│   └── unified/
├── parking-service/
│   ├── {grad}/
│   │   └── report/
└── providers/
    └── {naziv}/
        └── reports/
```

## Humanitarian izveštaji

### Generisanje template-a

```
Reports → Humanitarian → Generate Templates
```

Template se generiše u Excel formatu sa predefinisanim formama za svaku organizaciju.

### Upload izveštaja

1. **Reports → Upload Humanitarian**
2. Izaberi organizaciju
3. Upload popunjeni Excel fajl
4. Sistem validira format
5. Čuva na odgovarajuću lokaciju

### Skeniranje izveštaja

Sistem može skenirati sve uploadovane izveštaje i prikazati status:

```
Reports → Scan All Reports
```

## Zakazani izveštaji (Scheduled Reports)

Izveštaji se mogu zakazati za automatsko generisanje i slanje:

1. **Reports → Scheduled → New Schedule**
2. Izaberi tip i period
3. Podesi učestalost (mesečno / nedeljno)
4. Unesi email adrese primalaca
5. **Schedule**

Zakazani izveštaji su vidljivi u **Reports → Scheduled**.

## Global Counters

TRES prati globalne mesečne brojače po organizacijama i resetuje ih na kraju meseca:

```
Reports → Reset Monthly Counters
```

Istorija globalnih brojača:
```
public/reports/global-counters/
├── 2025/
│   ├── 05/ ... 12/
└── 2026/
    └── 01/
```

## Excel Generator

Za prilagođene Excel izveštaje koristi se `ExcelGenerator` komponenta:

```typescript
import ExcelJS from "exceljs";

// lib/reports/excel-generator.ts
// Generiše Excel sa custom formatiranjem, grafovima i pivot tabelama
```

## API endpoints

| Method | Endpoint | Opis |
|--------|----------|------|
| POST | `/api/reports/generate` | Generiši izveštaj |
| GET | `/api/reports/scan-unified` | Skeniraj unified izveštaje |
| POST | `/api/reports/upload-humanitarian` | Upload humanitarian |
| POST | `/api/reports/upload-parking` | Upload parking |
| POST | `/api/reports/upload-provider` | Upload provider |
| GET | `/api/reports/validate-system` | Validacija sistema |