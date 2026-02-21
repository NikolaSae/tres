---
id: analytics
title: Analitika i Dashboard
sidebar_label: 📈 Analitika
---

# Analitika i Dashboard

TRES ima sveobuhvatan analitički modul sa real-time podacima, grafovima, KPI metrikama i anomaly detectionom.

## Dashboard

Početni dashboard (`/dashboard`) prikazuje ključne metrike na jednom mestu:

- **Aktivni ugovori** — ukupan broj i po tipu
- **Ugovori koji ističu** — narednih 30 dana
- **Otvoreni prigovori** — neprocesirani
- **Prihod ovog meseca** — po provajderu/tipu
- **Quick actions** — linkovi do čestih akcija

## Analitički moduli

Navigacija: **Analytics →**

### Financials (Finansijska analitika)

```
Analytics → Financials
```

Prikazuje:
- **Revenue Breakdown** — prihodi po kategoriji (VAS, Bulk, Parking, Humanitarian)
- **Combined Financial View** — sve kategorije na jednom grafikonu
- **KPI Dashboard** — ključni finansijski indikatori
- **Anomaly Detection** — automatska detekcija neobičnih promena

### Sales Overview

```
Analytics → Sales
```

Prikazuje prihode od VAS i Bulk usluga:
- Mesečni trend (line chart)
- Poređenje po provajderima (bar chart)
- Top usluge po prihodu

### Complaints Analytics

```
Analytics → Complaints
```

- Prigovori po statusu (pie chart)
- Trend prigovora po mesecima
- Prigovori po provajderu
- Prosečno vreme rešavanja
- Kategorije prigovora

### Provider Analytics

```
Analytics → Providers
```

- Prihodi po provajderu
- Aktivne usluge po provajderu
- Poređenje provajdera

## Anomaly Detection

TRES automatski detektuje anomalije u podacima:

```typescript
// utils/anomaly-detection.ts
// Algoritam detektuje outlier-e koristeći Z-score metod
```

Kada se detektuje anomalija:
1. Prikazuje se upozorenje u analitičkom dashboardu
2. Šalje se email notifikacija adminu
3. Loguje se u audit log

## Grafikoni i vizualizacije

TRES koristi **Recharts** za sve grafove:

| Komponenta | Tip grafa | Gde se koristi |
|------------|-----------|----------------|
| `SalesChart` | Line chart | Sales analitika |
| `RevenueBreakdown` | Bar/Pie chart | Finansijska analitika |
| `TrendChart` | Area chart | Prigovori trend |
| `ExpiryTimelineChart` | Timeline | Ugovori isteka |
| `MonthlyComparisonChart` | Bar chart | Mesečno poređenje |

## Data Filters

Svi analitički prikazi imaju napredne filtere:

```
Analytics → [Modul] → Filters
```

Dostupni filteri:
- **Period** — od datuma / do datuma ili preset (ovaj mesec, kvartal, godina)
- **Provider** — jedan ili više
- **Tip usluge** — VAS / Bulk / Parking / Humanitarian
- **Status** — aktivan / neaktivan

## KPI Metrike

### Finansijski KPI-evi

| KPI | Opis |
|-----|------|
| Total Revenue | Ukupan prihod u periodu |
| Avg Monthly Revenue | Prosečni mesečni prihod |
| Revenue Growth | % rast u odnosu na prethodni period |
| Active Contracts | Broj aktivnih ugovora |

### Operativni KPI-evi

| KPI | Opis |
|-----|------|
| Complaint Resolution Time | Prosečno vreme rešavanja |
| Open Complaints | Broj otvorenih prigovora |
| Expiring Contracts | Ugovori koji ističu |
| Report Completion Rate | % generisanih izveštaja |

## Performance Metrics

Sistem prati i tehničke performance metrike:

```
Admin → Security → Performance
```

- API response time
- Database query performance
- Broj zahteva po endpoint-u
- Error rate

## API endpoints

| Method | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/analytics/financials` | Finansijski podaci |
| GET | `/api/analytics/sales` | Sales podaci |
| GET | `/api/complaints/statistics` | Statistike prigovora |
| GET | `/api/contracts/statistics` | Statistike ugovora |
| GET | `/api/security/performance` | Performance metrike |