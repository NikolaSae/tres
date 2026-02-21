---
id: humanitarian
title: Humanitarne Organizacije
sidebar_label: 🏢 Humanitarne Org.
---

# Humanitarne Organizacije

TRES upravljanje humanitarnim organizacijama koje prikupljaju donacije putem SMS-a na kratke brojeve u Srbiji.

## Šta su humanitarne organizacije?

Humanitarne organizacije (humorg) su neprofitne organizacije kojima operatori dodeljuju kratke SMS brojeve za prikupljanje donacija od građana. TRES prati:
- Registraciju i podatke o organizaciji
- Dodeljene kratke brojeve
- Mesečne finansijske izveštaje
- Procese obnove ugovora

## Kratki brojevi (Short Numbers)

Svaka humanitarna organizacija ima jedan ili više kratkih brojeva:

| Format | Primer | Opis |
|--------|--------|------|
| 4-cifreni | `1033` | Standard kratki broj |
| 4-cifreni | `3800` | Premium donacioni broj |

Kratki broj se pronalazi putem API-a:
```
GET /api/organizations/by-kratki-broj?number=1033
```

## Kreiranje organizacije

1. **Humanitarian Orgs → New**
2. Unesi:
   - Naziv organizacije
   - Kratki broj (short number)
   - PIB i matični broj
   - Kontakt podatke
   - Tip usluge (SMS / Voice / oba)
3. Poveži sa ugovorom
4. **Create**

## Mesečni izveštaji

Svaka humanitarna organizacija prima mesečni izveštaj sa:
- Brojem primljenih SMS poruka
- Ukupnim prihodom
- Brojem aktivnih donatora

### Generisanje izveštaja

```
Reports → Humanitarian → Generate
```

Izveštaji se generišu u Excel formatu i čuvaju u:
```
public/reports/{org-kratki-broj}/{godina}/{mesec}/
```

### Slanje izveštaja

Izveštaji se šalju automatski emailom ili ručno:

1. **Humanitarian Orgs → [Org] → Reports**
2. Izaberi period
3. **Send Report** — šalje na email organizacije

## Humanitarian Renewals

Modul za upravljanje obnovama ugovora humanitarnih organizacija.

### Proces obnove

```
PENDING → IN_REVIEW → APPROVED → COMPLETED
                    ↓
                 REJECTED
```

1. Sistem detektuje ugovor koji ističe u narednih 60 dana
2. Kreira se renewal zahtev sa statusom `PENDING`
3. Operater pregleda dokumentaciju
4. Odobrava ili odbija obnovu
5. Novi ugovor se kreira ili stari se produžava

### Prepaid transakcije

Import prepaid transakcija za humanitarne organizacije:

```
Humanitarian Orgs → [Org] → Import Prepaid
```

Podržava Excel format sa kolonama: datum, iznos, broj transakcija.

## Statistike

Za svaku organizaciju dostupne su statistike:
- Ukupan prikupljeni iznos po godini
- Mesečni trend donacija
- Broj aktivnih donatora
- Uporedba sa prethodnom godinom

## API endpoints

| Method | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/humanitarian-orgs` | Lista organizacija |
| POST | `/api/humanitarian-orgs` | Nova organizacija |
| GET | `/api/humanitarian-orgs/[id]` | Detalji |
| PUT | `/api/humanitarian-orgs/[id]` | Ažuriranje |
| GET | `/api/humanitarian-renewals` | Lista obnova |
| POST | `/api/humanitarian-renewals` | Nova obnova |
| GET | `/api/humanitarian-renewals/statistics` | Statistike obnova |