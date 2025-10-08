# Project API Structure

## app/api

### admin/

API rute za administraciju sistema

#### mcp/

Alat MCP (Management Control Panel)

- `logs/` – pregledi logova
- `my-logs/` – logovi trenutnog korisnika
- `refresh/` – osvežavanje podataka MCP
- `search-humanitarian-orgs/` – pretraga humanitarnih organizacija
- `stats/` – statistike MCP alata
- `system-health/` – zdravlje sistema
- `tools-usage/` – korišćenje alata
- `users/` – korisnici MCP

---

### analytics/

API za statistike i izveštaje

- `financials/` – finansijski izveštaji
- `sales/` – prodajni izveštaji

---

### auth/

Autentifikacija

- `[...nextauth]/` – NextAuth rute

---

### blacklist/

Blacklist korisnika/organizacija

---

### bulk-services/

API za Bulk usluge

- `[id]/` – detalji Bulk usluge po ID
- `export/` – eksport podataka
- `import/` – import podataka

---

### chat/

Chat API

- `database/` – full DB chat funkcionalnosti
- `database-simple/` – jednostavan DB chat

---

### complaints/

Reklamacije

- `[id]/` – detalji reklamacije
  - `attachments/` – fajlovi reklamacije
  - `comments/` – komentari
  - `status/` – status reklamacije
- `export/` – eksport reklamacija
- `statistics/` – statistike reklamacija

---

### contracts/

Ugovori

- `[id]/` – detalji ugovora
  - `attachments/` – fajlovi ugovora
  - `edit/` – izmena ugovora
  - `reminders/` – podsetnici
  - `renewal/` – obnovljeni ugovori
    - `attachments/` – fajlovi obnove
    - `status/` – status obnove
  - `services/` – povezane usluge
  - `status/` – status ugovora
- `expiring/` – ugovori na isteku
- `export/` – eksport ugovora
- `statistics/` – statistike ugovora
- `timeline/` – istorija ugovora

---

### cron/

Cron zadaci

- `check-expiring/` – proverava isteke ugovora

---

### humanitarian-orgs/

Humanitarne organizacije

- `[id]/` – pojedinačna organizacija
  - `contracts/` – ugovori organizacije
  - `services/` – usluge organizacije

---

### humanitarian-renewals/

Obnova humanitarnih ugovora

- `[id]/` – pojedinačna obnova
- `statistics/` – statistike obnova

---

### notifications/

Obaveštenja

- `email/` – slanje email notifikacija
- `push/` – push notifikacije

---

### operators/

Operateri

- `[id]/` – detalji operatera
  - `contracts/` – ugovori operatera
- `contracts/` – svi ugovori operatera

---

### organizations/

Organizacije

- `by-kratki-broj/` – pretraga po kratkom broju

---

### parking-services/

Parking servisi

- `[id]/` – detalji parking servisa
  - `contracts/` – ugovori
  - `reports/` – izveštaji
  - `services/` – usluge
- `parking-import/` – import parking podataka
- `rename-file/` – preimenovanje fajlova
- `typescript-import/` – TS import
- `typescript-import-stream/` – TS stream import
- `upload/` – upload fajlova

---

### products/

Proizvodi

- `[id]/` – detalji proizvoda

---

### providers/

Provajderi

- `[id]/` – detalji provajdera
  - `bulk-services/` – bulk usluge provajdera
  - `contracts/` – ugovori provajdera
  - `edit/` – izmena provajdera
  - `renwe-contract/` – obnova ugovora
  - `status/` – status provajdera
  - `vas-services/` – VAS usluge
- `by-name/` – pretraga po imenu
- `upload/` – upload provajdera
- `vas-import/` – import VAS podataka

---

### reports/

Izveštaji

- `generate/` – generisanje izveštaja
- `scan-unified/` – skeniranje sistema
- `upload-humanitarian/` – upload humanitarnih izveštaja
- `upload-parking/` – upload parking izveštaja
- `upload-provider/` – upload provajder izveštaja
- `validate-system/` – validacija sistema

---

### security/

Bezbednosne rute

- `logs/` – pregled logova
- `performance/` – performanse
  - `summary/` – sumarni pregled
- `permissions/` – prava i permisije

---

### sender-blacklist/

Blacklist pošiljalaca

---

### services/

Usluge

- `[id]/` – detalji usluge
- `bulk/` – bulk usluge
- `categories/` – kategorije usluga
- `humanitarian/` – humanitarne usluge
- `parking/` – parking usluge
- `import/` – import usluga

---

### test/

Test API ruta

---

### users/

Korisnici

- `[id]/` – detalji korisnika

---

### vas-services/

VAS usluge

- `postpaid-import-stream/` – import postpaid
- `upload/` – upload VAS usluga

---

**Last Updated:** January 2025  
**Version:** 1.0.0