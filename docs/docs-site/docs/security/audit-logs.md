---
id: audit-logs
title: Audit Logovi
sidebar_label: 📋 Audit Logovi
---

# Audit Logovi

TRES loguje sve važne akcije u sistemu za bezbednost i compliance.

## Šta se loguje?

- Login / Logout korisnika
- Kreiranje, izmena i brisanje ugovora
- Promene statusa prigovora
- Upload i brisanje fajlova
- Promene uloga korisnika
- Pristup admin panelu
- API greške i pokušaji neovlašćenog pristupa
- Cron job izvršavanja

## Pregled audit logova

```
Admin → Audit Logs
```

Filtriraj po:
- Korisniku
- Tipu akcije (CREATE / UPDATE / DELETE / LOGIN)
- Entitetu (Contract / Complaint / Provider...)
- Vremenskom periodu

## Blacklist logovi

Poseban log za blacklist aktivnosti:

```
Audit Logs → Blacklist Logs
```

Prikazuje sve pokušaje slanja sa blacklisted pošiljalaca.

## Security Event Log

```
Admin → Security → Activity Log
```

Uključuje:
- Neuspešne pokušaje logina (brute force detekcija)
- Pristup sa nepoznatih IP adresa
- Rate limit narušavanja
- Sumnjive API pozive

## Rate Limiting

TRES ima ugrađen rate limiter za zaštitu od DDoS i brute force:

```typescript
// lib/security/rate-limiter.ts
// Koristi Upstash Redis za tracking request-a po IP/korisnik
```

Limiti (konfigurisani u `lib/constants.ts`):
- Login pokušaji: 5 u 15 minuta
- API zahtevi: 100 u minutu
- File upload: 10 u satu