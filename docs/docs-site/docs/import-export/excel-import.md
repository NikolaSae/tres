---
id: excel-import
title: Excel Import
sidebar_label: 📥 Excel Import
---

# Excel Import

TRES podržava masovni import podataka iz Excel (.xlsx) fajlova za sve glavne module.

## Podržani moduli za import

| Modul | Endpoint | Format |
|-------|----------|--------|
| Services (VAS) | `/api/services/import` | .xlsx |
| Bulk Services | `/api/bulk-services/import` | .xlsx |
| Complaints | Direktno u UI | .csv |
| Parking data | `/api/parking-services/typescript-import` | .xlsx |
| VAS Provider data | `/api/providers/vas-import` | .xlsx |
| Humanitarian prepaid | `/api/humanitarian-orgs/[id]` | .xlsx |

## Kako importovati

1. Idi na odgovarajući modul
2. Klikni **Import** dugme
3. Upload `.xlsx` fajl (max 50MB)
4. Pregled prvih 10 redova (preview)
5. Potvrdi import

## Format Excel fajla

### VAS Services import

| Kolona | Tip | Obavezno | Opis |
|--------|-----|----------|------|
| naziv | string | ✅ | Naziv usluge |
| kratkiBroj | string | ✅ | Kratki broj |
| providerId | string | ✅ | ID provajdera |
| cena | number | ✅ | Cena po SMS-u |
| tip | VAS/BULK | ✅ | Tip usluge |
| opis | string | ❌ | Opis usluge |

### Parking data import

| Kolona | Tip | Obavezno | Opis |
|--------|-----|----------|------|
| datum | date | ✅ | Datum transakcije |
| iznos | number | ✅ | Iznos u RSD |
| brojTransakcija | number | ✅ | Broj SMS transakcija |

## Streaming import

Za velike fajlove (100k+ redova) koristi streaming endpoint koji procesira podatke u chunk-ovima:

```
POST /api/parking-services/typescript-import-stream
```

Prednosti:
- Ne blokira server
- Progress bar u realnom vremenu
- Automatski recovery od grešaka

## Greške pri importu

Ako import ne prode, sistem prikazuje:
- Broj uspešno importovanih redova
- Broj redova sa greškama
- Detalji greške po redu (npr. "red 15: nevažeći iznos")

Fajlovi sa greškama se čuvaju u `scripts/errors/` za analizu.

## Python procesori

Za naprednu obradu pre importa dostupne su Python skripte:

```bash
# Procesiranje parking podataka
python scripts/parking_service_processor.py \
  --input scripts/input/ \
  --output scripts/processed/

# Procesiranje VAS podataka
python scripts/vas_provider_processor.py \
  --input scripts/input-vas-services/ \
  --output scripts/processed-vas-services/

# Email procesiranje
python scripts/email_processor.py \
  --input scripts/email/ \
  --output scripts/processed/
```

Ove skripte transformišu sirove podatke od provajdera u format koji TRES može da importuje.