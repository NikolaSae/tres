# 🗄️ TRES - Šema Baze Podataka

## 📊 Pregled

TRES koristi **PostgreSQL** bazu podataka sa **Prisma ORM** alatom. Baza je optimizovana za velike količine podataka sa fokusom na efikasnost upita i integritet podataka.

---

## 🏗️ Struktura Baze

### Osnovni Entiteti

```
┌─────────────────┐
│     User        │ (Korisnici sistema)
└─────────────────┘
        │
        ├─── Provider (Telekom provideri)
        ├─── HumanitarianOrg (Humanitarne organizacije)
        ├─── ParkingService (Parking servisi)
        ├─── Contract (Ugovori)
        └─── Service (Usluge)
```

---

## 📋 Tabele i Relacije

### 1. **User** - Korisnici Sistema

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String
  name          String?
  role          UserRole  @default(USER)
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relacije
  createdContracts     Contract[]
  createdProviders     Provider[]
  createdOrgs          HumanitarianOrg[]
}

enum UserRole {
  ADMIN
  USER
  VIEWER
}
```

**Opis:**
- Osnovna autentifikacija i autorizacija
- Role-based access control (RBAC)
- Audit trail - prati ko je kreirao koji entitet

---

### 2. **Provider** - Telekom Provideri

```prisma
model Provider {
  id              String    @id @default(cuid())
  name            String    @unique
  code            String    @unique
  isActive        Boolean   @default(true)
  contactPerson   String?
  contactEmail    String?
  contactPhone    String?
  address         String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  createdById     String?
  
  // Relacije
  contracts       Contract[]
  services        Service[]
  createdBy       User?      @relation(fields: [createdById], references: [id])
  
  @@index([name])
  @@index([code])
}
```

**Primeri providera:**
- Telekom Srbija
- Telenor
- A1
- Globaltel

**Indexi:**
- `name` - za brzu pretragu po nazivu
- `code` - za identifikaciju providera

---

### 3. **Contract** - Ugovori

```prisma
model Contract {
  id                  String          @id @default(cuid())
  contractNumber      String          @unique
  name                String
  type                ContractType
  status              ContractStatus  @default(DRAFT)
  
  // Datumi
  startDate           DateTime
  endDate             DateTime
  signedDate          DateTime?
  
  // Finansije
  revenuePercentage   Decimal?        @db.Decimal(5, 2)
  monthlyFee          Decimal?        @db.Decimal(10, 2)
  
  // Povezani entiteti
  providerId          String?
  humanitarianOrgId   String?
  parkingServiceId    String?
  
  // Metadata
  description         String?         @db.Text
  notes               String?         @db.Text
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt
  createdById         String?
  
  // Relacije
  provider            Provider?           @relation(fields: [providerId], references: [id])
  humanitarianOrg     HumanitarianOrg?    @relation(fields: [humanitarianOrgId], references: [id])
  parkingService      ParkingService?     @relation(fields: [parkingServiceId], references: [id])
  attachments         ContractAttachment[]
  renewals            ContractRenewal[]
  reminders           ContractReminder[]
  services            Service[]
  createdBy           User?               @relation(fields: [createdById], references: [id])
  
  @@index([contractNumber])
  @@index([status])
  @@index([endDate])
  @@index([providerId])
}

enum ContractType {
  PROVIDER
  HUMANITARIAN
  PARKING
  BULK
}

enum ContractStatus {
  DRAFT
  ACTIVE
  PENDING
  RENEWAL_IN_PROGRESS
  EXPIRED
  TERMINATED
}
```

**Važne napomene:**
- `contractNumber` je jedinstveni identifikator
- `endDate` ima index za automatske provere isteka
- Podrška za tri vrste ugovora: Provider, Humanitarian, Parking

---

### 4. **ContractAttachment** - Prilozi Ugovora

```prisma
model ContractAttachment {
  id            String    @id @default(cuid())
  contractId    String
  fileName      String
  filePath      String
  fileSize      Int
  fileType      String
  uploadedAt    DateTime  @default(now())
  uploadedById  String?
  
  contract      Contract  @relation(fields: [contractId], references: [id], onDelete: Cascade)
  uploadedBy    User?     @relation(fields: [uploadedById], references: [id])
  
  @@index([contractId])
}
```

**Podržani formati:**
- PDF
- DOCX
- XLSX
- CSV

---

### 5. **ContractRenewal** - Obnove Ugovora

```prisma
model ContractRenewal {
  id                    String                      @id @default(cuid())
  contractId            String
  subStatus             ContractRenewalSubStatus    @default(DOCUMENT_COLLECTION)
  
  // Datumi
  renewalStartDate      DateTime?
  proposedStartDate     DateTime
  proposedEndDate       DateTime
  
  // Finansije
  proposedRevenue       Decimal?                    @db.Decimal(5, 2)
  
  // Workflow checkpoints
  documentsReceived     Boolean                     @default(false)
  legalApproved         Boolean                     @default(false)
  technicalApproved     Boolean                     @default(false)
  financialApproved     Boolean                     @default(false)
  managementApproved    Boolean                     @default(false)
  signatureReceived     Boolean                     @default(false)
  
  // Metadata
  comments              String?                     @db.Text
  internalNotes         String?                     @db.Text
  createdAt             DateTime                    @default(now())
  updatedAt             DateTime                    @updatedAt
  createdById           String?
  
  // Relacije
  contract              Contract                    @relation(fields: [contractId], references: [id], onDelete: Cascade)
  attachments           ContractRenewalAttachment[]
  createdBy             User?                       @relation(fields: [createdById], references: [id])
  
  @@index([contractId])
  @@index([subStatus])
}

enum ContractRenewalSubStatus {
  DOCUMENT_COLLECTION
  LEGAL_REVIEW
  TECHNICAL_REVIEW
  FINANCIAL_APPROVAL
  MANAGEMENT_APPROVAL
  AWAITING_SIGNATURE
  FINAL_PROCESSING
}
```

**Workflow obnove:**
1. `DOCUMENT_COLLECTION` - Prikupljanje dokumentacije
2. `LEGAL_REVIEW` - Pravni pregled
3. `TECHNICAL_REVIEW` - Tehnički pregled
4. `FINANCIAL_APPROVAL` - Finansijsko odobrenje
5. `MANAGEMENT_APPROVAL` - Odobrenje menadžmenta
6. `AWAITING_SIGNATURE` - Čeka potpis
7. `FINAL_PROCESSING` - Finalno procesiranje

---

### 6. **HumanitarianOrg** - Humanitarne Organizacije

```prisma
model HumanitarianOrg {
  id              String    @id @default(cuid())
  name            String    @unique
  shortNumber     String    @unique
  registrationNum String?
  contactPerson   String?
  contactEmail    String?
  contactPhone    String?
  address         String?
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  createdById     String?
  
  // Relacije
  contracts       Contract[]
  services        HumanitarianService[]
  renewals        HumanitarianRenewal[]
  createdBy       User?     @relation(fields: [createdById], references: [id])
  
  @@index([shortNumber])
  @@index([name])
}
```

**Kratki brojevi (shortNumbers):**
- Format: 4-5 cifara (npr. 9999, 10000)
- Jedinstveni po organizaciji
- Koriste se za SMS i Voice usluge

---

### 7. **HumanitarianService** - Humanitarne Usluge

```prisma
model HumanitarianService {
  id                  String                @id @default(cuid())
  humanitarianOrgId   String
  type                HumanitarianServiceType
  shortNumber         String
  keyword             String?
  price               Decimal               @db.Decimal(10, 2)
  description         String?               @db.Text
  isActive            Boolean               @default(true)
  activationDate      DateTime?
  createdAt           DateTime              @default(now())
  updatedAt           DateTime              @updatedAt
  
  // Relacije
  organization        HumanitarianOrg       @relation(fields: [humanitarianOrgId], references: [id], onDelete: Cascade)
  
  @@index([humanitarianOrgId])
  @@index([shortNumber])
}

enum HumanitarianServiceType {
  SMS
  VOICE
}
```

---

### 8. **ParkingService** - Parking Servisi

```prisma
model ParkingService {
  id              String    @id @default(cuid())
  name            String    @unique
  serviceNumber   String    @unique
  provider        String?
  contactPerson   String?
  contactEmail    String?
  contactPhone    String?
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relacije
  contracts       Contract[]
  
  @@index([serviceNumber])
  @@index([name])
}
```

---

### 9. **Service** - Sve Usluge

```prisma
model Service {
  id              String        @id @default(cuid())
  name            String
  code            String        @unique
  category        ServiceCategory
  type            String?
  description     String?       @db.Text
  
  // Povezivanje sa entitetima
  contractId      String?
  providerId      String?
  
  // Finansije
  price           Decimal?      @db.Decimal(10, 2)
  revenueShare    Decimal?      @db.Decimal(5, 2)
  
  isActive        Boolean       @default(true)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  // Relacije
  contract        Contract?     @relation(fields: [contractId], references: [id])
  provider        Provider?     @relation(fields: [providerId], references: [id])
  
  @@index([category])
  @@index([code])
  @@index([providerId])
}

enum ServiceCategory {
  VAS
  BULK
  HUMANITARIAN
  PARKING
}
```

---

## 🔐 Sigurnost i Performanse

### Indexi

```sql
-- Najčešće korišćeni upiti
CREATE INDEX idx_contract_status ON "Contract"("status");
CREATE INDEX idx_contract_end_date ON "Contract"("endDate");
CREATE INDEX idx_service_category ON "Service"("category");
CREATE INDEX idx_provider_name ON "Provider"("name");
```

### Kaskadno Brisanje

```prisma
// Kada se obriše Contract, brišu se i vezani podaci
attachments  ContractAttachment[]  @relation(onDelete: Cascade)
renewals     ContractRenewal[]     @relation(onDelete: Cascade)
```

### Soft Delete

Neki entiteti koriste `isActive` flag umesto fizičkog brisanja:
- `Provider.isActive`
- `HumanitarianOrg.isActive`
- `Service.isActive`

---

## 📈 Statistike

```sql
-- Broj aktivnih ugovora
SELECT COUNT(*) FROM "Contract" WHERE status = 'ACTIVE';

-- Ugovori koji ističu u narednih 60 dana
SELECT * FROM "Contract" 
WHERE status = 'ACTIVE' 
  AND "endDate" BETWEEN NOW() AND NOW() + INTERVAL '60 days';

-- Top 5 providera po broju ugovora
SELECT p.name, COUNT(c.id) as contract_count
FROM "Provider" p
LEFT JOIN "Contract" c ON p.id = c."providerId"
GROUP BY p.id
ORDER BY contract_count DESC
LIMIT 5;
```

---

## 🔄 Migracije

```bash
# Kreiraj novu migraciju
npx prisma migrate dev --name add_new_field

# Primeni migracije
npx prisma migrate deploy

# Reset baze (PAŽLJIVO!)
npx prisma migrate reset

# Generiši Prisma klijent
npx prisma generate
```

---

## 🌱 Seed Podaci

```bash
# Pokreni seed skriptu
npm run seed

# Ili direktno
npx prisma db seed
```

**Seed uključuje:**
- Demo korisnici (admin, user)
- Telekom provideri (Telekom, Telenor, A1)
- Test humanitarne organizacije
- Sample ugovori

---

## 📊 ER Dijagram (Simplified)

```
┌─────────────┐         ┌──────────────┐
│    User     │────────>│   Provider   │
└─────────────┘         └──────────────┘
      │                        │
      │                        │
      v                        v
┌─────────────┐         ┌──────────────┐
│  Contract   │<────────│   Service    │
└─────────────┘         └──────────────┘
      │
      │
      v
┌──────────────────┐
│ ContractRenewal  │
└──────────────────┘
```

---

## 🎯 Best Practices

1. **Uvek koristi transakcije** za kompleksne operacije
2. **Indeksiraj** često pretražene kolone
3. **Validuj** podatke pre upisa (Zod sheme)
4. **Audit trail** - prati ko je šta menjao
5. **Soft delete** za kritične entitete

---

**Poslednje ažuriranje:** Januar 2025  
**Prisma verzija:** 6.9.0  
**Baza:** PostgreSQL (Supabase)