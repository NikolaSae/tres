---
id: csv-import
title: CSV Import
sidebar_label: 📄 CSV Import
---

# CSV Import

Pored Excel formata, TRES podržava i CSV import za određene module.

## Moduli sa CSV podrškom

| Modul | Format | Separator |
|-------|--------|-----------|
| Complaints | .csv | zarez (,) ili tačkazarez (;) |
| Services | .csv | zarez |
| Bulk Services | .csv | zarez |

## Complaints CSV format

```csv
ime,prezime,telefon,email,provider,opis,iznos,datum
Marko,Marković,0601234567,marko@email.com,Infobip,Nenaručeni SMS,200,2025-01-15
```

## Validacija

Sistem validira CSV pre importa:
- Provera obaveznih kolona
- Format telefona i emaila
- Validni datumi
- Numerički iznosi

## CSV validator

```typescript
// utils/csv-validator.ts
// Validira CSV fajlove pre importa
// Vraća listu grešaka sa rednim brojevima
```

## Priprema CSV fajlova

Ako koristiš Excel za pripremu:
1. Otvori Excel
2. File → Save As → CSV UTF-8
3. Obezbedi UTF-8 encoding za srpska slova

Ako koristiš Python:
```python
import csv
import pandas as pd

df = pd.read_excel("input.xlsx")
df.to_csv("output.csv", index=False, encoding="utf-8-sig")
```