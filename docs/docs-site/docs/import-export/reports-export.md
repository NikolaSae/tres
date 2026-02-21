---
id: reports-export
title: Export Izveštaja
sidebar_label: 📤 Export
---

# Export Izveštaja

TRES podržava export podataka u Excel, CSV i PDF formatima.

## Export opcije po modulu

| Modul | Excel | CSV | PDF |
|-------|-------|-----|-----|
| Contracts | ✅ | ❌ | ✅ |
| Complaints | ✅ | ✅ | ❌ |
| Bulk Services | ✅ | ✅ | ❌ |
| Services | ✅ | ❌ | ❌ |
| Parking Reports | ✅ | ❌ | ❌ |
| Humanitarian Reports | ✅ | ❌ | ❌ |

## Kako exportovati

### Iz liste (Export sve)

1. Idi na modul (npr. Complaints)
2. Postavi filtere ako treba
3. Klikni **Export → Excel / CSV**
4. Fajl se automatski download-uje

### Iz detalja entiteta (Export jedan)

1. Otvori entitet
2. **Actions → Export**

## Excel export

TRES koristi **ExcelJS** za generisanje Excel fajlova sa:
- Formatiranim ćelijama
- Zamrznutim header-om
- Auto-width kolonama
- Bojama po statusu

```typescript
// lib/reports/excel-generator.ts
// utils/excel-generator.ts
```

## Scheduled export

Izveštaji se mogu zakazati za automatski export i slanje emailom:

```
Reports → Scheduled → New Schedule → Email recipients
```

## API export endpoints

```
GET /api/complaints/export?from=2025-01-01&to=2025-12-31
GET /api/contracts/export?status=ACTIVE
GET /api/bulk-services/export?providerId=xxx
GET /api/services/export
```

Svi export endpoint-i vraćaju `application/octet-stream` sa odgovarajućim `Content-Disposition` header-om.