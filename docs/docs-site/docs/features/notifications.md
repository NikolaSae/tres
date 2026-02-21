---
id: notifications
title: Notifikacije
sidebar_label: 🔔 Notifikacije
---

# Notifikacije

TRES ima višeslojni sistem notifikacija — in-app notifikacije, email i push obaveštenja.

## Tipovi notifikacija

| Tip | Kanal | Okidač |
|-----|-------|--------|
| Ugovor ističe | Email + In-app | 30, 14, 7 dana pre isteka |
| Novi prigovor | Email + In-app | Kreiranje prigovora |
| Prigovor dodeljen | Email + In-app | Dodeljivanje operateru |
| Status promjena | In-app | Promena statusa prigovora |
| Anomalija detektovana | Email + In-app | Anomaly detection |
| Izveštaj generisan | In-app | Uspešno generisanje |
| Cron job status | Email (admin) | Greška u cron job-u |

## In-App Notifikacije

Prikazuju se u gornjem desnom uglu (bell ikonica) sa brojem nepročitanih.

### Pregled notifikacija

```
Notifications → (Bell ikonica u navbar-u)
```

Ili puna stranica:
```
/notifications
```

### Označavanje kao pročitano

- Klik na notifikaciju — otvara detalje i označava kao pročitano
- **Mark all as read** — označava sve

## Email Notifikacije

TRES šalje email notifikacije putem **Resend** servisa.

### Šabloni emailova

Svi email šabloni su u `lib/notifications/templates.ts`:
- `contractExpiryEmail` — upozorenje o isteku ugovora
- `complaintAssignedEmail` — prigovor dodeljen
- `newComplaintEmail` — novi prigovor primljen
- `anomalyAlertEmail` — detektovana anomalija
- `cronAlertEmail` — greška u automatskom procesu

### Pregled emailova

In-app email preview dostupan u:
```
Admin → Notifications → Email Preview
```

## Podešavanja notifikacija

Svaki korisnik može podesiti koje notifikacije želi da prima:

```
Notifications → Settings
```

Dostupne opcije:
- **Email notifikacije** — uključi / isključi po tipu
- **In-app notifikacije** — uključi / isključi po tipu
- **Učestalost** — odmah / dnevni digest / nedeljni digest

## Admin kontrole

Admin može slati sistemska obaveštenja svim korisnicima:

```
Admin → Notifications → Broadcast Message
```

## Pusher (Real-time)

Za real-time in-app notifikacije TRES koristi **Pusher**:

```typescript
// lib/pusher.ts
// WebSocket konekcija za instant notifikacije
```

Kada se desi event (npr. novi prigovor), Pusher odmah šalje notifikaciju svim relevantnim korisnicima bez refresha stranice.

## API endpoints

| Method | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/notifications` | Lista notifikacija |
| PUT | `/api/notifications` | Označi kao pročitano |
| GET | `/api/notifications/unread-count` | Broj nepročitanih |
| POST | `/api/notifications/email` | Pošalji email |
| POST | `/api/notifications/push` | Push notifikacija |