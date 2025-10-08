# Contracts Module Documentation

## 🧩 Overview
The **Contracts** module allows administrators and managers to **view, create, edit, and track** all contracts across providers, humanitarian organizations, and parking services.

It includes:
- Centralized contract management with filtering and pagination
- Contract statistics and expiration tracking
- Integration with providers and humanitarian organizations
- Contract creation and editing through reusable forms

---

## 📂 Directory Structure
app/
└── (protected)/
└── contracts/
├── page.tsx
├── new/
│ └── page.tsx
├── [id]/
│ ├── page.tsx
│ └── edit/
│ └── page.tsx
├── providers/
│ └── page.tsx
└── expiring/
└── page.tsx

markdown
Copy code

---

## ⚙️ `page.tsx` — Main Contracts Page

This is the **entry point** for all contracts in the system.

### Key features:
- Displays all contracts with advanced search, filter, and pagination.
- Supports both **server-side and client-side pagination**.
- Filters by type, status, partner, and keyword.
- Provides quick links to:
  - `/contracts/new` (Create new contract)
  - `/contracts/expiring` (Expiring contracts)
  - `/contracts/import` (Bulk import)

### Data Sources:
- Fetches from `db.contract` via Prisma.
- Includes relational data:
  - `provider`
  - `humanitarianOrg`
  - `parkingService`
  - `services`
  - `_count` for services, attachments, and reminders

### UI Components:
- `<ContractsSection />` for contract display
- `<Button />` for navigation and actions
- Lucide icons: `PlusCircle`, `Clock`, `FileSpreadsheet`

---

## 📝 `new/page.tsx` — Create New Contract

Used for adding new contracts into the system.

### Features:
- Uses the shared `<ContractForm />` component.
- Preloads:
  - Humanitarian organizations (`getHumanitarianOrgs`)
  - Providers (`getProviders`)
  - Parking services (`getParkingServices`)
  - Operators (`getAllOperators`)
- Returns a dynamic form interface for creating contracts.

### Metadata:
```ts
{
  title: "Create New Contract | Management Dashboard",
  description: "Create a new contract in the system",
}
🏢 providers/page.tsx — Provider Contracts Overview
Displays all contracts belonging to providers.

Components:
<ContractList filter="provider" />

<ContractTypeDistribution type="PROVIDER" />

Features:
Suspense-based lazy loading

Provides quick visual analytics per provider type

Useful for management-level insights

⏳ expiring/page.tsx — Expiring Contracts
Shows contracts that are nearing expiration.

Features:
Fetches data from:

/api/contracts

/api/contracts/statistics/expiry

/api/contracts/timeline/expiry

Displays statistics and visual timeline

Links to /contracts/[id] for direct access

🔍 [id]/page.tsx — Contract Details
Displays detailed information about a single contract.

Features:
Shows related data (provider, organization, services)

Displays attachments and revenues

“Edit Contract” button navigates to /contracts/[id]/edit

Uses server components to load data efficiently

✏️ [id]/edit/page.tsx — Edit Contract
Used to modify existing contract details.

Features:
Reuses <ContractForm /> with initial data.

Checks user privileges for editing.

After saving, redirects back to /contracts/[id].

🧠 Data Flow Overview
mermaid
Copy code
graph LR
  A[Contracts Page] -->|Select Contract| B[Contract Details]
  B -->|Edit| C[Edit Contract]
  A -->|New Contract| D[New Contract Page]
  A -->|Expiring| E[Expiring Contracts]
  A -->|Provider Filter| F[Provider Contracts]
🧱 Shared Components
Component	Description
ContractForm	Used for both creating and editing contracts.
ContractsSection	Displays and manages contract lists with filters.
ContractList	Handles filtered contract rendering (e.g. provider contracts).
ContractTypeDistribution	Chart component for contract analytics.

🧩 Related API Endpoints
Endpoint	Description
/api/contracts	Fetches paginated and filtered contracts.
/api/contracts/statistics/expiry	Returns statistics for expiring contracts.
/api/contracts/timeline/expiry	Provides time-based expiration data.
/api/contracts/[id]	Fetches details for a single contract.

🔐 Permissions & Roles
Role	Permissions
Admin	Full CRUD access to all contracts.
User	Read-only access; can view but not edit contracts.

🧭 Navigation Summary
Action	Route
View all contracts	/contracts
Create new contract	/contracts/new
Edit contract	/contracts/[id]/edit
View expiring contracts	/contracts/expiring
View provider contracts	/contracts/providers

📘 Additional Notes
Contracts module fully supports server-side rendering.

Pagination logic auto-switches to client-side when filters are not active.

Uses Tailwind + Lucide icons for clean, responsive UI.

yaml
Copy code

---

