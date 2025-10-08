# Project Structure – app Directory

Ova dokumentacija prikazuje strukturu `app` foldera hijerarhijski, sa kratkim opisima funkcionalnosti svake sekcije.

## (protected)
Sadrži sve rute i stranice koje su zaštićene autentifikacijom i dostupne samo prijavljenim korisnicima/adminima.

### 403
- `page.tsx` – prikazuje stranicu za "Forbidden" grešku (pristup zabranjen).

### 404
- `page.tsx` – prikazuje stranicu za "Not Found" grešku.

### _components
Sadrži zajedničke UI komponente koje se koriste kroz više stranica.
- `floating-chat-button.tsx` – dugme za chat interfejs koje se prikazuje uvek.
- `navbar.tsx` – navigaciona traka.
- `newbar.tsx` – alternativna navigaciona traka.
- `sidebar.tsx` – bočna traka za navigaciju.

### admin
Admin panel i alati za upravljanje aplikacijom.
- `aidash` – Admin AI Dashboard sekcija
  - `actions` – server-side actions za dashboard
  - `components` – vizuelne komponente dashboarda (AnalyticsPanel, ChatInterface, StatCard…)
  - `page.tsx` – ulazna stranica dashboarda
- `complaints` – admin pregled reklamacija
  - `page.tsx` – prikaz svih reklamacija
  - `reports` – generisanje i pregled izveštaja reklamacija
  - `statistics` – statistike i analize reklamacija
- `notifications` – upravljanje notifikacijama
- `security` – sigurnosne funkcije admin panela
  - `activity-logs` – zapis aktivnosti korisnika
  - `performance` – statistika performansi
  - `user-roles` – upravljanje korisničkim ulogama

### analytics
Stranice za analizu podataka.
- `complaints` – analiza reklamacija
- `financials` – finansijski izveštaji
- `providers` – analiza provajdera
- `sales` – analiza prodaje
- `layout.tsx` – layout za analytics sekciju

### audit-logs
- `page.tsx` – prikaz dnevnika aktivnosti (audit logova).

### bulk-services
Upravljanje Bulk servisima (upload, edit, pregled).
- `[id]` – pojedinačni Bulk servis
- `import` – uvoz Bulk servisa
- `new` – kreiranje novog Bulk servisa

### chat
- `page.tsx` – interfejs za chat između korisnika i podrške.

### client
- `page.tsx` – client-side funkcionalnosti (pregled statusa, servisne info…).

### complaints
Upravljanje reklamacijama (klijent i admin deo).
- `[id]` – pojedinačna reklamacija
  - `ComplaintDetailPageClient.tsx` – detaljan prikaz reklamacije za klijenta
  - `edit/page.tsx` – editovanje reklamacije
- `new/page.tsx` – kreiranje nove reklamacije
- `page.tsx` – lista svih reklamacija

### contracts
Upravljanje ugovorima.
- `[id]` – pojedinačni ugovor
  - `edit/page.tsx` – editovanje ugovora
- `expiring/page.tsx` – pregled ugovora koji uskoro ističu
- `new/page.tsx` – kreiranje novog ugovora
- `providers/page.tsx` – pregled ugovora po provajderu

### dashboard
- `page.tsx` – glavna dashboard stranica korisnika/admina

### humanitarian-orgs
Upravljanje humanitarnim organizacijama.
- `[id]` – pojedinačna organizacija
  - `edit/page.tsx` – editovanje organizacije
- `new/page.tsx` – kreiranje nove organizacije
- `page.tsx` – lista svih humanitarnih organizacija

### humanitarian-renewals
- `page.tsx` – prikaz obnavljanja ugovora humanitarnih organizacija

### notifications
- `page.tsx` – pregled svih notifikacija
- `settings/page.tsx` – podešavanja notifikacija

### operators
Upravljanje operaterima.
- `[id]` – pojedinačni operater
  - `edit/page.tsx` – editovanje operatera
- `new/page.tsx` – kreiranje novog operatera
- `page.tsx` – lista svih operatera

### parking-services
Upravljanje parking servisima.
- `[id]` – pojedinačni parking servis
  - `edit/page.tsx` – editovanje servisa
- `new/page.tsx` – kreiranje novog parking servisa
- `page.tsx` – lista svih parking servisa

### products
- `[id]/page.tsx` – detaljan prikaz proizvoda
- `page.tsx` – lista proizvoda

### providers
Upravljanje provajderima.
- `[id]` – pojedinačni provajder
  - `edit/page.tsx` – editovanje provajdera
- `new/page.tsx` – kreiranje novog provajdera
- `page.tsx` – lista provajdera

### reports
Generisanje i pregled izveštaja.
- `generate/page.tsx` – kreiranje izveštaja
- `scheduled/page.tsx` – pregled zakazanih izveštaja
- `page.tsx` – lista svih izveštaja

### server
- `page.tsx` – server informacije/status

### services
Upravljanje servisima različitih tipova.
- `[serviceType]` – tip servisa (VAS, Bulk, Parking…)
  - `[id]` – pojedinačni servis
    - `edit/page.tsx` – editovanje servisa
- `import/page.tsx` – uvoz servisa
- `new/page.tsx` – kreiranje novog servisa
- `page.tsx` – pregled svih servisa

### settings
- `page.tsx` – podešavanja korisnika/admina

### _miscellaneous_
- `folderi.txt` – tekstualni spisak foldera
