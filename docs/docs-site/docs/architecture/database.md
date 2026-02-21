---
id: database
title: Baza Podataka
sidebar_label: 🗄️ Baza Podataka
---

# Baza Podataka

TRES koristi **PostgreSQL** (hostan na Supabase) sa **Prisma ORM**.

## Ključni entiteti

```
User
 ├── Account (OAuth)
 └── Session

Provider
 └── Contract ─────────────────────────────┐
      ├── ContractAttachment               │
      ├── ContractReminder                 │
      └── ContractService ─── Service ─────┤
                                           │
HumanitarianOrg ── HumanitarianService ────┤
 └── HumanitarianRenewal                  │
                                           │
ParkingService ─────────────────────────────┘
 └── ReportFile

Operator

Complaint
 └── ComplaintComment

Notification
ActivityLog
QueryLog
SenderBlacklist
```

## Glavne tabele

### User
Korisnici sistema sa ulogama i 2FA podrškom.

```sql
User {
  id, name, email, password,
  role: ADMIN | USER | VIEWER,
  isTwoFactorEnabled,
  emailVerified, image
}
```

### Contract
Centralna tabela — čuva sve tipove ugovora.

```sql
Contract {
  id, title, type: PROVIDER | HUMANITARIAN | PARKING,
  status: DRAFT | ACTIVE | RENEWAL | EXPIRED | TERMINATED,
  startDate, endDate,
  value, currency,
  providerId?, humanitarianOrgId?, parkingServiceId?,
  createdById
}
```

### Provider
Telekomunikacioni provajderi VAS i Bulk SMS usluga.

```sql
Provider {
  id, name, pib, maticniBroj,
  contactEmail, contactPhone,
  logoUrl, isActive
}
```

### HumanitarianOrg
Humanitarne organizacije sa kratkim brojevima.

```sql
HumanitarianOrg {
  id, name, kratkiBroj,
  pib, contactEmail,
  serviceType: SMS | VOICE | BOTH,
  isActive
}
```

### ParkingService
Parking servisi po gradovima Srbije.

```sql
ParkingService {
  id, name, city,
  shortNumber, contactEmail,
  revenuePercentage,
  isActive
}
```

### Complaint
Prigovori korisnika.

```sql
Complaint {
  id, submitterName, submitterPhone, submitterEmail,
  providerId, serviceCategory,
  description, amount,
  status: OPEN | IN_PROGRESS | ESCALATED | RESOLVED | CLOSED,
  assignedToId,
  createdAt, resolvedAt
}
```

## Migracije

```bash
# Nova migracija
npx prisma migrate dev --name naziv_promene

# Status migracija
npx prisma migrate status

# Deploy u produkciju
npx prisma migrate deploy
```

## Indeksi

Ključni indeksi za performanse:

```prisma
@@index([status, endDate])       // Contract expiry queries
@@index([providerId, createdAt]) // Complaints by provider
@@index([status, assignedToId])  // Complaints by assignee
@@index([kratkiBroj])           // HumanitarianOrg lookup
```

## Seed podaci

```bash
npm run seed
# ili
npx prisma db seed
```

Seed kreira demo korisnike, test provajdere, humanitarne organizacije i sample ugovore za razvoj.