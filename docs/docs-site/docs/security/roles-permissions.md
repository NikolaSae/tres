---
id: roles-permissions
title: Uloge i Dozvole
sidebar_label: 👥 Uloge & Dozvole
---

# Uloge i Dozvole (RBAC)

TRES koristi Role-Based Access Control (RBAC) sistem za kontrolu pristupa.

## Uloge korisnika

| Uloga | Opis | Pristup |
|-------|------|---------|
| `ADMIN` | Pun pristup svemu | Svi moduli + administracija |
| `USER` | Standardni pristup | Svi moduli osim admin panela |
| `VIEWER` | Samo čitanje | Pregled podataka, bez izmena |

## Dozvole po modulu

| Modul | ADMIN | USER | VIEWER |
|-------|-------|------|--------|
| Contracts — Read | ✅ | ✅ | ✅ |
| Contracts — Write | ✅ | ✅ | ❌ |
| Contracts — Delete | ✅ | ❌ | ❌ |
| Complaints — Read | ✅ | ✅ | ✅ |
| Complaints — Assign | ✅ | ✅ | ❌ |
| Reports — Generate | ✅ | ✅ | ❌ |
| Admin Panel | ✅ | ❌ | ❌ |
| User Management | ✅ | ❌ | ❌ |
| Security Logs | ✅ | ❌ | ❌ |

## Upravljanje korisnicima

```
Admin → User Management
```

Admin može:
- Pregledati sve korisnike
- Promeniti ulogu korisnika
- Deaktivirati nalog
- Force logout korisnika

## Permission Gate komponenta

Za conditionally renderovanje UI elemenata:

```tsx
import { PermissionGate } from "@/components/security/PermissionGate";

<PermissionGate allowedRoles={["ADMIN"]}>
  <DeleteButton />
</PermissionGate>
```

## Role Gate

Za zaštitu celih stranica:

```tsx
import { RoleGate } from "@/components/auth/role-gate";

<RoleGate allowedRole="ADMIN">
  <AdminContent />
</RoleGate>
```

## Server-side provera permisija

```typescript
import { checkPermission } from "@/actions/security/check-permission";

const hasPermission = await checkPermission("DELETE_CONTRACT");
if (!hasPermission) redirect("/403");
```