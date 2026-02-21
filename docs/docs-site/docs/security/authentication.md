---
id: authentication
title: Autentifikacija
sidebar_label: 🔐 Autentifikacija
---

# Autentifikacija

TRES koristi **NextAuth.js v5** za sigurnu autentifikaciju korisnika.

## Login proces

1. Korisnik unosi email i lozinku na `/auth/login`
2. Server validira kredencijale i proverava bcrypt hash lozinke
3. Ako je 2FA aktiviran — traži se TOTP kod
4. Session token se čuva u HTTP-only cookie

## Two-Factor Authentication (2FA)

Korisnici mogu aktivirati 2FA u podešavanjima profila:

```
Profile → Settings → Enable Two-Factor Auth
```

TRES koristi TOTP (Time-based One-Time Password) kompatibilan sa Google Authenticator, Authy i sličnim aplikacijama.

## Registracija

```
/auth/register
```

Novi korisnici moraju verifikovati email adresu pre prvog logina. Verifikacioni link se šalje putem Resend email servisa.

## Password reset

```
/auth/reset → unesi email → provjeri email → /auth/new-password
```

Reset token važi **1 sat** od slanja.

## Session management

Sessions se upravljaju putem NextAuth.js:
- Session trajanje: 30 dana (konfigurisano u `auth.ts`)
- Automatski refresh sesije
- Force logout iz svih uređaja (admin funkcija)

## Zaštita ruta

Sve rute pod `app/(protected)/` su automatski zaštićene middleware-om:

```typescript
// middleware.ts
// Redirect na /auth/login ako korisnik nije autentifikovan
```

Javne rute (bez login-a): `/`, `/auth/*`