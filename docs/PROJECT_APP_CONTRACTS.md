# 📋 Contracts Module Documentation

## 🎯 Overview

The **Contracts Module** is the core component of TRES for managing all contractual relationships with providers, humanitarian organizations, and parking services.

### Key Capabilities

- ✅ Centralized contract management with advanced filtering
- ✅ Contract lifecycle tracking (Draft → Active → Renewal → Expired)
- ✅ Automated expiration monitoring and notifications
- ✅ Document attachment management
- ✅ Revenue tracking and reporting
- ✅ Multi-party contract support

---

## 📂 Directory Structure

```
app/(protected)/contracts/
├── page.tsx                    # Main contracts list
├── new/
│   └── page.tsx               # Create new contract
├── [id]/
│   ├── page.tsx               # Contract details
│   └── edit/
│       └── page.tsx           # Edit contract
├── providers/
│   └── page.tsx               # Provider contracts view
├── expiring/
│   └── page.tsx               # Expiring contracts
└── import/
    └── page.tsx               # Bulk import contracts

components/contracts/
├── ContractForm.tsx            # Reusable contract form
├── ContractList.tsx            # Contract list component
├── ContractCard.tsx            # Contract card display
├── ContractStats.tsx           # Statistics dashboard
├── RenewalDialog.tsx           # Renewal workflow dialog
└── StatusChangeDialog.tsx      # Status management

actions/contracts/
├── create.ts                   # Create contract action
├── update.ts                   # Update contract action
├── delete.ts                   # Delete contract action
├── upload-attachment.ts        # File upload action
└── contract-actions.ts         # Status & renewal actions

lib/contracts/
├── validators.ts               # Zod validation schemas
├── expiration-checker.ts       # Automated expiration checking
├── renewal-workflow.ts         # Renewal process logic
└── utils.ts                    # Helper functions
```

---

## 🗂️ Module Routes

### Main Routes

| Route | Purpose | Access |
|-------|---------|--------|
| `/contracts` | View all contracts with filtering | All authenticated users |
| `/contracts/new` | Create new contract | Admin, User |
| `/contracts/[id]` | View contract details | All authenticated users |
| `/contracts/[id]/edit` | Edit existing contract | Admin, Creator |
| `/contracts/expiring` | View expiring contracts | All authenticated users |
| `/contracts/providers` | Provider-specific contracts | All authenticated users |
| `/contracts/import` | Bulk import from Excel/CSV | Admin |

---

## 📄 `page.tsx` — Main Contracts Page

### Purpose

Central hub for viewing and managing all contracts in the system.

### Key Features

**1. Advanced Filtering:**

- Filter by contract type (Provider, Humanitarian, Parking)
- Filter by status (Active, Draft, Expired, etc.)
- Filter by partner/organization
- Full-text search by contract name or number
- Date range filtering

**2. Pagination:**

- Server-side pagination for large datasets
- Configurable page size (10, 25, 50, 100)
- Quick navigation controls

**3. Sorting:**

- Sort by contract number
- Sort by expiration date
- Sort by creation date
- Sort by status

### Data Fetching

```typescript
// Example data fetch
const contracts = await db.contract.findMany({
  where: {
    status: filters.status,
    type: filters.type,
    OR: [
      { name: { contains: searchQuery, mode: 'insensitive' } },
      { contractNumber: { contains: searchQuery, mode: 'insensitive' } }
    ]
  },
  include: {
    provider: { select: { name: true, id: true } },
    humanitarianOrg: { select: { name: true, id: true } },
    parkingService: { select: { name: true, id: true } },
    services: { select: { id: true, name: true } },
    _count: {
      select: {
        attachments: true,
        reminders: true,
        renewals: true
      }
    }
  },
  orderBy: { [sortField]: sortDirection },
  skip: (page - 1) * pageSize,
  take: pageSize
});
```

### UI Components

```typescript
<ContractsSection 
  contracts={contracts}
  filters={filters}
  onFilterChange={handleFilterChange}
  pagination={paginationData}
/>
```

---

## ✏️ `new/page.tsx` — Create New Contract

### Purpose

Form interface for creating new contracts.

### Features

**Pre-loaded Data:**

- All active providers
- All humanitarian organizations
- All parking services
- Service operators list

**Form Sections:**

1. **Basic Information**
   - Contract name
   - Contract number (auto-generated or manual)
   - Contract type selection
   - Description

2. **Partner Selection**
   - Provider dropdown (for PROVIDER type)
   - Humanitarian org dropdown (for HUMANITARIAN type)
   - Parking service dropdown (for PARKING type)

3. **Date Configuration**
   - Start date picker
   - End date picker
   - Signed date (optional)
   - Auto-calculated duration

4. **Financial Terms**
   - Revenue percentage (0-100%)
   - Monthly fee (optional)
   - Currency selection

5. **Additional Details**
   - Notes/comments
   - Internal reference number
   - Tags/categories

**Validation:**

```typescript
const contractSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  contractNumber: z.string().min(1, 'Contract number is required'),
  type: z.enum(['PROVIDER', 'HUMANITARIAN', 'PARKING', 'BULK']),
  status: z.enum(['DRAFT', 'ACTIVE', 'PENDING']),
  startDate: z.date(),
  endDate: z.date(),
  revenuePercentage: z.number().min(0).max(100).optional(),
  monthlyFee: z.number().min(0).optional(),
}).refine(data => data.endDate > data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate']
});
```

### Success Flow

```
User fills form → Validates input → Calls createContract action
→ Creates DB record → Uploads attachments (if any)
→ Redirects to /contracts/[id] → Shows success toast
```

---

## 🔍 `[id]/page.tsx` — Contract Details

### Purpose

Detailed view of a single contract with all related information.

### Sections Displayed

**1. Contract Header**

- Contract name and number
- Status badge with color coding
- Quick action buttons (Edit, Delete, Renew)
- Expiration countdown/status

**2. Partner Information**

- Partner name and type
- Contact information
- Related services count

**3. Financial Details**

- Revenue percentage
- Monthly fee
- Total revenue (calculated)
- Payment terms

**4. Timeline**

- Start date
- End date
- Signed date
- Days remaining/expired
- Visual progress bar

**5. Attachments**

- List of uploaded files
- Download buttons
- File type icons
- Upload date and user
- Add new attachment button

**6. Related Services**

- Table of linked services
- Service names and codes
- Service status
- Quick links to service details

**7. Renewal History**

- Previous renewals
- Renewal dates
- Status of each renewal
- Timeline visualization

**8. Activity Log**

- Contract creation
- Status changes
- Updates/modifications
- User who made changes
- Timestamps

### Data Loading

```typescript
const contract = await db.contract.findUnique({
  where: { id: params.id },
  include: {
    provider: true,
    humanitarianOrg: true,
    parkingService: true,
    services: {
      include: {
        provider: { select: { name: true } }
      }
    },
    attachments: {
      include: {
        uploadedBy: {
          select: { name: true, email: true }
        }
      },
      orderBy: { uploadedAt: 'desc' }
    },
    renewals: {
      orderBy: { createdAt: 'desc' },
      take: 5
    },
    reminders: {
      orderBy: { sentAt: 'desc' },
      take: 10
    },
    createdBy: {
      select: { name: true, email: true }
    }
  }
});
```

---

## ✏️ `[id]/edit/page.tsx` — Edit Contract

### Purpose

Modify existing contract details.

### Features

**Pre-filled Form:**

- Loads existing contract data
- Maintains relationships
- Preserves attachments

**Editable Fields:**

- All basic information
- Dates (with validation)
- Financial terms
- Status (with workflow validation)
- Notes and comments

**Restrictions:**

- Cannot change contract type after creation
- Cannot modify if contract is terminated
- Admin override available

**Validation:**

```typescript
// Status change validation
function validateStatusChange(currentStatus, newStatus) {
  const validTransitions = {
    DRAFT: ['ACTIVE', 'TERMINATED'],
    ACTIVE: ['RENEWAL_IN_PROGRESS', 'EXPIRED', 'TERMINATED'],
    PENDING: ['ACTIVE', 'RENEWAL_IN_PROGRESS', 'TERMINATED'],
    RENEWAL_IN_PROGRESS: ['ACTIVE', 'EXPIRED', 'TERMINATED'],
    EXPIRED: ['RENEWAL_IN_PROGRESS', 'TERMINATED'],
    TERMINATED: [] // No transitions allowed
  };
  
  return validTransitions[currentStatus]?.includes(newStatus);
}
```

---

## ⏰ `expiring/page.tsx` — Expiring Contracts

### Purpose

Dashboard for contracts that are nearing expiration.

### Features

**Expiration Categories:**

1. **Urgent (< 30 days)**
   - Red badge
   - High priority
   - Email notifications sent

2. **Soon (30-60 days)**
   - Orange badge
   - Medium priority
   - First notification

3. **Upcoming (60-90 days)**
   - Yellow badge
   - Low priority
   - Planning stage

**Statistics:**

- Total expiring contracts
- Count by category
- Renewal progress
- Revenue at risk

**Quick Actions:**

- Initiate renewal process
- Send reminder email
- Extend contract
- Mark as renewed

**Filtering:**

- By urgency level
- By partner
- By contract type
- By revenue size

---

## 🏢 `providers/page.tsx` — Provider Contracts

### Purpose

Specialized view for provider-specific contracts.

### Features

**Provider Analytics:**

- Total contracts per provider
- Active vs expired breakdown
- Revenue distribution
- Service count

**Charts & Graphs:**

- Pie chart: Contracts by provider
- Bar chart: Revenue comparison
- Timeline: Contract lifecycle
- Heatmap: Expiration schedule

**Filters:**

- Select specific provider
- Filter by status
- Date range selection

---

## 📊 Contract Statistics API

### Endpoints

```typescript
// Get expiration statistics
GET /api/contracts/statistics/expiry
Response: {
  urgent: 5,
  soon: 12,
  upcoming: 23,
  totalRevenue: 150000
}

// Get timeline data
GET /api/contracts/timeline/expiry
Response: [
  { date: '2025-01-15', count: 2, revenue: 25000 },
  { date: '2025-02-01', count: 3, revenue: 30000 }
]

// Get contract count by status
GET /api/contracts/statistics/status
Response: {
  ACTIVE: 45,
  DRAFT: 5,
  EXPIRED: 12,
  RENEWAL_IN_PROGRESS: 8
}
```

---

## 🔄 Contract Workflow

### Status Lifecycle

```
DRAFT
  ↓
PENDING
  ↓
ACTIVE → RENEWAL_IN_PROGRESS → ACTIVE (renewed)
  ↓           ↓
EXPIRED    EXPIRED
  ↓           ↓
TERMINATED  TERMINATED
```

### Renewal Workflow

1. **DOCUMENT_COLLECTION**
   - Gather all required documents
   - Upload to system

2. **LEGAL_REVIEW**
   - Legal team reviews terms
   - Approval required

3. **TECHNICAL_REVIEW**
   - Technical feasibility check
   - Service compatibility

4. **FINANCIAL_APPROVAL**
   - Finance team approval
   - Budget allocation

5. **MANAGEMENT_APPROVAL**
   - Final management sign-off

6. **AWAITING_SIGNATURE**
   - Send to partner for signature
   - Track signature status

7. **FINAL_PROCESSING**
   - Complete renewal
   - Update contract dates
   - Activate new term

---

## 🔒 Permissions & Security

### Role-Based Access

| Action | Admin | User | Viewer |
|--------|-------|------|--------|
| View contracts | ✅ | ✅ | ✅ |
| Create contracts | ✅ | ✅ | ❌ |
| Edit own contracts | ✅ | ✅ | ❌ |
| Edit all contracts | ✅ | ❌ | ❌ |
| Delete contracts | ✅ | ❌ | ❌ |
| Manage renewals | ✅ | ✅ | ❌ |
| Change status | ✅ | ✅ | ❌ |
| View reports | ✅ | ✅ | ✅ |

### Data Protection

```typescript
// Row-level security
function canAccessContract(userId: string, contract: Contract) {
  const user = await getCurrentUser(userId);
  
  if (user.role === 'ADMIN') return true;
  if (user.role === 'VIEWER') return true; // Read-only
  if (contract.createdById === userId) return true;
  
  return false;
}
```

---

## 📧 Automated Notifications

### Email Triggers

**1. Contract Expiring Soon**

```typescript
// Sent at 60, 30, and 15 days before expiration
Subject: Contract Expiring Soon: [Contract Name]
Recipients: Contract creator, Admin team
```

**2. Contract Expired**

```typescript
// Sent on expiration date
Subject: Contract Expired: [Contract Name]
Recipients: Contract creator, Admin team, Finance team
```

**3. Renewal Initiated**

```typescript
// Sent when renewal process starts
Subject: Contract Renewal Started: [Contract Name]
Recipients: All stakeholders
```

**4. Renewal Completed**

```typescript
// Sent when renewal is finalized
Subject: Contract Renewal Completed: [Contract Name]
Recipients: All stakeholders
```

### Notification Settings

```typescript
// User preferences
interface NotificationPreferences {
  emailNotifications: boolean;
  urgentOnly: boolean;
  digestFrequency: 'daily' | 'weekly' | 'none';
  notifyBefore: number; // days
}
```

---

## 🧪 Testing

### Unit Tests

```typescript
describe('Contract Creation', () => {
  it('should create a contract with valid data', async () => {
    const result = await createContract(validData);
    expect(result.success).toBe(true);
  });
  
  it('should reject invalid dates', async () => {
    const invalidData = { ...validData, endDate: pastDate };
    const result = await createContract(invalidData);
    expect(result.success).toBe(false);
  });
});
```

### Integration Tests

```typescript
describe('Contract Renewal Workflow', () => {
  it('should complete full renewal cycle', async () => {
    // Create contract
    // Update to RENEWAL_IN_PROGRESS
    // Complete all workflow steps
    // Verify contract is renewed
  });
});
```

---

## 🎯 Best Practices

### DO ✅

- Always validate dates before saving
- Use status change validation
- Keep audit trail of changes
- Send notifications for important events
- Use transactions for complex operations
- Implement proper error handling

### DON'T ❌

- Don't skip validation
- Don't allow status changes without workflow
- Don't delete contracts (use soft delete)
- Don't expose sensitive data in logs
- Don't bypass permissions checks

---

## 🔧 Common Issues & Solutions

### Issue: Contract won't save

**Solution:**

```typescript
// Check validation errors
const result = contractSchema.safeParse(data);
if (!result.success) {
  console.error(result.error.errors);
}
```

### Issue: Renewal process stuck

**Solution:**

```typescript
// Check renewal sub-status
// Ensure all approval flags are set
// Verify user has proper permissions
```

### Issue: Expiration notifications not sending

**Solution:**

```typescript
// Check cron job configuration
// Verify email service credentials
// Check contract endDate is in future
```

---

## 📚 Related Documentation

- [API Documentation](./PROJECT_API_DOCUMENTATION.md)
- [Database Schema](./baza-podataka.md)
- [System Architecture](./arhitektura.md)

---

**Last Updated:** January 2025  
**Module Version:** 1.0.0  
**Maintained by:** TRES Development Team