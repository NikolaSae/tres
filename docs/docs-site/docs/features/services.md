---
id: services
title: Usluge (VAS & Bulk)
sidebar_label: 📱 Usluge
---

# Usluge (VAS & Bulk SMS)

Modul za upravljanje svim tipovima telekomunikacionih usluga koje su predmet ugovora.

## Tipovi usluga

```
Services
├── VAS (Value Added Services)    — Premium SMS/MMS usluge
├── Bulk SMS                      — Masovno slanje SMS-a
├── Humanitarian                  — Donacioni kratki brojevi
└── Parking                       — SMS plaćanje parkinga
```

## VAS Usluge

### Šta je VAS?

Value Added Services su premium telekomunikacione usluge naplaćene putem kratkih brojeva. Primer: igrice na kratkim brojevima, ringtonovi, weather servisi.

### Upravljanje VAS uslugama

**Pregled svih VAS usluga:**
```
Services → Filter: VAS
```

Svaka VAS usluga sadrži:
- Naziv i opis usluge
- Kratki broj
- Provider koji pruža uslugu
- Cenu po SMS-u
- Tip (Postpaid / Prepaid / Subscription)
- Status (Aktivan / Neaktivan)

### Import VAS podataka

VAS transakcioni podaci (broj poruka, prihodi) se importuju iz Excel fajlova:

```
Services → Import → Upload VAS Excel
```

Python procesor za napredni import:
```bash
python scripts/vas_provider_processor.py input.xlsx
```

## Bulk SMS Usluge

### Šta je Bulk SMS?

Masovno slanje SMS poruka za marketing kampanje, obaveštenja i notifikacije.

### Upravljanje Bulk uslugama

Modul **Bulk Services** je odvojen od VAS-a sa dodatnim funkcionalnostima:

- Kreiranje bulk kampanje
- Upload liste primalaca
- Praćenje statusa isporuke
- Export izveštaja

### Import Bulk podataka

```
Bulk Services → Import → Upload .xlsx
```

Format Excel fajla za import:
```
| Naziv kampanje | Datum | Broj poruka | Status |
```

## Kategorije usluga

Usluge su organizovane po kategorijama:

```typescript
enum ServiceCategory {
  VAS = "VAS",
  BULK = "BULK",
  HUMANITARIAN = "HUMANITARIAN",
  PARKING = "PARKING",
}
```

## Filtriranje usluga

Na listi usluga možeš filtrirati po:
- Kategoriji (VAS / Bulk / Humanitarian / Parking)
- Provajderu
- Statusu (aktivan / neaktivan)
- Datumu kreiranja

## Statistike usluga

Za svaku uslugu dostupne su statistike:
- Broj aktivnih korisnika
- Mesečni prihod
- Trend korišćenja

## Operators (Operatori)

Operatori su mobilni operatori (npr. Telekom Srbija, A1, Telenor) koji obrađuju SMS saobraćaj. Svaka VAS usluga prolazi kroz operatora.

### Upravljanje operatorima

```
Admin → Operators
```

- Kreiranje / brisanje operatora
- Pregled ugovora po operatoru
- Statistike saobraćaja

## API endpoints

| Method | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/services` | Lista svih usluga |
| POST | `/api/services` | Nova usluga |
| GET | `/api/services/[id]` | Detalji |
| GET | `/api/services/categories` | Kategorije |
| POST | `/api/services/import` | Import |
| GET | `/api/services/parking` | Parking usluge |
| GET | `/api/services/humanitarian` | Humanitarian usluge |
| GET | `/api/bulk-services` | Bulk kampanje |
| POST | `/api/bulk-services/import` | Import bulk |
| GET | `/api/bulk-services/export` | Export bulk |