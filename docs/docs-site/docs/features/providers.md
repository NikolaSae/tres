---
id: providers
title: Telekom Provideri
sidebar_label: 📡 Provideri
---

# Telekom Provideri

Modul za upravljanje telekom provajderima. Provideri su centralni entitet za VAS i Bulk SMS usluge.

## Šta je provider?

Provider je telekomunikaciona kompanija koja pruža usluge kratkih brojeva (VAS — Value Added Services) ili Bulk SMS usluge. Primeri: Infobip, OneClick Solutions, MKONEKT, NPAY.

## Upravljanje providerima

### Kreiranje providera

1. **Providers → New Provider**
2. Unesi:
   - Naziv kompanije
   - PIB i matični broj
   - Kontakt osoba i email
   - Adresa
3. Upload loga (PNG/JPG)
4. **Create Provider**

### Pregled providera

Lista svih provajdera sa filterima po:
- Statusu (aktivan / neaktivan)
- Tipu usluga (VAS / Bulk)
- Datumu kreiranje

Klikni na providera za detalje koji uključuju:
- **Overview** — osnovni podaci
- **Contracts** — svi ugovori sa ovim provajderom
- **Services** — sve usluge
- **Activity Log** — istorija promena

## VAS Usluge (Value Added Services)

VAS usluge su premium SMS/MMS usluge naplaćene putem kratkih brojeva.

### Import VAS podataka

VAS transakcioni podaci se importuju iz Excel/CSV fajlova koje šalju provajderi:

1. **Providers → [Provider ime] → Import VAS Data**
2. Upload `.xlsx` fajl od provajdera
3. Sistem automatski parsira i mapuje podatke
4. Pregled i potvrda

### Tipovi VAS usluga

| Tip | Opis |
|-----|------|
| `POSTPAID` | Naplativi putem mesečnog računa |
| `PREPAID` | Naplativi odmah sa prepaid kredita |
| `SUBSCRIPTION` | Mesečna pretplata |

## Bulk SMS Usluge

Bulk SMS je masovno slanje SMS poruka za marketing i obaveštenja.

### Upravljanje Bulk uslugama

Modul **Bulk Services** (odvojen od VAS):
- Kreiranje bulk kampanja
- Praćenje broja poslatih poruka
- Import sa Excel-a
- Export izveštaja

## Provider logovi

Sistem automatski loguje sve akcije vezane za provajdera — upload izveštaja, promene statusa, itd. Dostupno u **Provider → Activity Log**.

## Statistike provajdera

Za svakog provajdera dostupne su statistike:
- Ukupan prihod po periodu
- Broj aktivnih usluga
- Broj aktivnih ugovora
- Trend prihoda (grafikon)

## API endpoints

| Method | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/providers` | Lista provajdera |
| POST | `/api/providers` | Novi provajder |
| GET | `/api/providers/[id]` | Detalji |
| PUT | `/api/providers/[id]` | Ažuriranje |
| DELETE | `/api/providers/[id]` | Brisanje |
| POST | `/api/providers/vas-import` | Import VAS podataka |
| POST | `/api/providers/upload` | Upload loga |

## Server Actions

```typescript
import { createProvider } from "@/actions/providers/create";
import { getAllProviders } from "@/actions/providers/getAllProviders";
import { getProviderDetails } from "@/actions/providers/getProviderDetails";
```