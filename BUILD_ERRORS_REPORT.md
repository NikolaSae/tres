# Build Errors Report

**Projekat:** next-auth-template
**Datum:** 2026-02-12
**Ukupno gresaka:** 704 TypeScript errors u 130+ fajlova

---

## Top 20 fajlova po broju gresaka

| # | Fajl | Gresaka | Status |
|---|------|---------|--------|
| 1 | `schemas/index.ts` | 60 | FIXING |
| 2 | `mcp-server/src/index.ts` | 47 | FIXING |
| 3 | `components/complaints/ComplaintForm.tsx` | 43 | FIXING |
| 4 | `scripts/vas-import/PostpaidServiceProcessor.ts` | 30 | FIXING |
| 5 | `components/humanitarian-orgs/HumanitarianOrgForm.tsx` | 27 | FIXING |
| 6 | `lib/actions/contract-actions.ts` | 19 | pending |
| 7 | `utils/excel-generator.ts` | 14 | pending |
| 8 | `auth.ts` | 14 | pending |
| 9 | `lib/notifications/templates.ts` | 12 | pending |
| 10 | `components/security/PerformanceMetrics.tsx` | 11 | pending |
| 11 | `lib/contracts/reminder-scheduler.ts` | 10 | pending |
| 12 | `components/contracts/reports/ContractKpiDashboard.tsx` | 10 | pending |
| 13 | `lib/services/statistics.ts` | 9 | pending |
| 14 | `components/notifications/NotificationSettings.tsx` | 9 | pending |
| 15 | `auth.config.ts` | 9 | pending |
| 16 | `components/ui/use-toast1.tsx` | 8 | pending |
| 17 | `lib/mcp/email-tools.ts` | 7 | pending |
| 18 | `lib/bulk-services/statistics.ts` | 7 | pending |
| 19 | `lib/actions/complaints.ts` | 7 | pending |
| 20 | `lib/mcp/write-tools.ts` | 6 | pending |

---

## Najcesci tipovi gresaka

| Error Code | Opis | Broj |
|------------|------|------|
| TS2322 | Type assignment mismatch | 155 |
| TS2339 | Property does not exist on type | 124 |
| TS2304 | Cannot find name | 85 |
| TS2353 | Object literal unknown properties | 52 |
| TS18048 | Value is possibly undefined | 40 |
| TS2345 | Argument type mismatch | 38 |
| TS7006 | Parameter implicitly has 'any' type | 37 |
| TS2305 | Module has no exported member | 28 |
| TS7031 | Binding element implicitly has 'any' type | 22 |
| TS2551 | Property does not exist (did you mean?) | 14 |

---

## Kompletna lista svih fajlova sa greskama (130 fajlova)

### API Routes (23 fajla)
- `app/api/admin/mcp/my-logs/route.ts`
- `app/api/admin/mcp/users/[userId]/logs/route.ts`
- `app/api/admin/mcp/users/route.ts`
- `app/api/analytics/financials/route.ts`
- `app/api/analytics/sales/route.ts`
- `app/api/chat/route.ts`
- `app/api/contracts/[id]/attachments/route.ts`
- `app/api/contracts/[id]/edit/route.ts`
- `app/api/contracts/[id]/reminders/route.ts`
- `app/api/contracts/[id]/renewal/status/route.ts`
- `app/api/contracts/[id]/route.ts`
- `app/api/contracts/export/route.ts`
- `app/api/contracts/route.ts`
- `app/api/humanitarian-orgs/[id]/route.ts`
- `app/api/humanitarian-renewals/route.ts`
- `app/api/notifications/email/route.ts`
- `app/api/parking-services/[id]/reports/route.ts`
- `app/api/parking-services/activity/route.ts`
- `app/api/parking-services/reports/send/route.ts`
- `app/api/products/[id]/route.ts`
- `app/api/services/categories/route.ts`
- `app/api/vas-services/postpaid-import-stream/route.ts`
- `app/api/vas-services/upload/route.ts`

### Components (52 fajla)
- `components/analytics/FinancialOverview.tsx`
- `components/analytics/SalesChart.tsx`
- `components/analytics/SalesOverview.tsx`
- `components/analytics/ServicePerformance.tsx`
- `components/auth/login-form.tsx`
- `components/blacklist/BlacklistSection.tsx`
- `components/blacklist/CreateBlacklistEntryDialog.tsx`
- `components/blacklist/SenderBlacklistTable.tsx`
- `components/bulk-services/BulkServiceForm.tsx`
- `components/bulk-services/BulkServiceList.tsx`
- `components/bulk-services/ImportForm.tsx`
- `components/complaints/CommentSection.tsx`
- `components/complaints/ComplaintFilters.tsx`
- `components/complaints/ComplaintForm.tsx`
- `components/complaints/ComplaintFormWrapper.tsx`
- `components/complaints/NotificationBanner.tsx`
- `components/complaints/reports/ExcelExport.tsx`
- `components/complaints/reports/KpiDashboard.tsx`
- `components/contracts/AttachmentList.tsx`
- `components/contracts/AttachmentUpload.tsx`
- `components/contracts/ContractForm.tsx`
- `components/contracts/ContractList.tsx`
- `components/contracts/ContractStatusManager.tsx`
- `components/contracts/ContractsSection.tsx`
- `components/contracts/ExpiryWarning.tsx`
- `components/contracts/ServiceSelector.tsx`
- `components/contracts/category/HumanitarianContractCard.tsx`
- `components/contracts/category/ParkingContractCard.tsx`
- `components/contracts/category/ProviderContractCard.tsx`
- `components/contracts/renewal-substatus-dialog.tsx`
- `components/contracts/reports/ContractKpiDashboard.tsx`
- `components/humanitarian-orgs/HumanitarianOrgContracts.tsx`
- `components/humanitarian-orgs/HumanitarianOrgFilters.tsx`
- `components/humanitarian-orgs/HumanitarianOrgForm.tsx`
- `components/humanitarian-orgs/HumanitarianOrgList.tsx`
- `components/notifications/NotificationList.tsx`
- `components/notifications/NotificationSettings.tsx`
- `components/operators/OperatorCard.tsx`
- `components/operators/OperatorContracts.tsx`
- `components/operators/OperatorDetails.tsx`
- `components/operators/OperatorForm.tsx`
- `components/parking-services/ParkingReportSender.tsx`
- `components/parking-services/ParkingServiceCard.tsx`
- `components/parking-services/ParkingServiceDetails.tsx`
- `components/parking-services/ParkingServiceFilters.tsx`
- `components/parking-services/ParkingServiceForm.tsx`
- `components/parking-services/ParkingServiceServicesOverview.tsx`
- `components/parking-services/ReportSelectorDialog.tsx`
- `components/products/ProductCard.tsx`
- `components/products/ProductForm.tsx`
- `components/products/ProductList.tsx`
- `components/providers/ProviderCard.tsx`
- `components/providers/ProviderContracts.tsx`
- `components/providers/ProviderDetails.tsx`
- `components/providers/ProviderForm.tsx`
- `components/providers/ProviderList.tsx`
- `components/providers/ProviderLogList.tsx`
- `components/providers/ProviderServicesForContracts.tsx`
- `components/providers/ProviderServicesOverview.tsx`
- `components/reports/ExcelGenerator.tsx`
- `components/reports/HumanitarianFileUploader.tsx`
- `components/security/ActivityLog.tsx`
- `components/security/BlackLogTable.tsx`
- `components/security/PerformanceMetrics.tsx`
- `components/security/PermissionGate.tsx`
- `components/services/ImportForm.tsx`
- `components/services/ParkingServiceProcessorForm.tsx`
- `components/services/ProviderProcessorForm.tsx`
- `components/services/ServiceForm.tsx`
- `components/services/ServiceList.tsx`
- `components/services/category/BulkServiceCard.tsx`
- `components/services/category/VasServiceCard.tsx`
- `components/ui/calendar.tsx`
- `components/ui/date-picker.tsx`
- `components/ui/toaster1.tsx`
- `components/ui/use-toast1.tsx`

### Hooks (18 fajlova)
- `hooks/use-bulk-services.ts`
- `hooks/use-check-blacklisted-senders.ts`
- `hooks/use-complaints.ts`
- `hooks/use-contract-reminders.ts`
- `hooks/use-current-role.ts`
- `hooks/use-humanitarian-orgs.ts`
- `hooks/use-humanitarian-renewals.ts`
- `hooks/use-operators.ts`
- `hooks/use-parking-services.ts`
- `hooks/use-products-by-service.ts`
- `hooks/use-products.ts`
- `hooks/use-provider-contracts.ts`
- `hooks/use-provider-logs.ts`
- `hooks/use-providers-by-service.ts`
- `hooks/use-revenue-breakdown.ts`
- `hooks/use-sender-blacklist.ts`
- `hooks/use-services.ts`
- `hooks/use-toast.ts`

### Lib (22 fajla)
- `lib/actions/complaints.ts`
- `lib/actions/contract-actions.ts`
- `lib/auth/adapters/listAuthenticatorsByUserId.ts`
- `lib/bulk-services/csv-processor.ts`
- `lib/bulk-services/statistics.ts`
- `lib/bulk-services/validators.ts`
- `lib/contracts/notification-sender.ts`
- `lib/contracts/reminder-scheduler.ts`
- `lib/contracts/revenue-calculator.ts`
- `lib/email-templates/parking-report-email.ts`
- `lib/mcp/ai-context-builder.ts`
- `lib/mcp/ai-prompt.ts`
- `lib/mcp/email-tools.ts`
- `lib/mcp/index.ts`
- `lib/mcp/internal-server.ts`
- `lib/mcp/server.ts`
- `lib/mcp/write-tools.ts`
- `lib/notifications/templates.ts`
- `lib/operators/validators.ts`
- `lib/reports/excel-generator.ts`
- `lib/reports/scheduled-jobs.ts`
- `lib/security/audit-logger.ts`
- `lib/security/backup-service.ts`
- `lib/services/csv-processor.ts`
- `lib/services/statistics.ts`
- `lib/types/parking-service-types.ts`
- `lib/types/service-types.ts`
- `lib/utils.ts`

### Scripts (6 fajlova)
- `scripts/vas-import/ParkingServiceProcessor.tsx`
- `scripts/vas-import/PostpaidServiceProcessor.ts`
- `scripts/vas-import/VasImportService.tsx`
- `scripts/vas-import/processors/ExcelProcessor.tsx`
- `scripts/vas-import/processors/PostpaidExcelProcessor.ts`
- `scripts/vas-import/utils/ParkingImportUtils.ts`

### Utils (5 fajlova)
- `utils/complaint-notification.ts`
- `utils/complaint-statistics.ts`
- `utils/excel-generator.ts`
- `utils/import-processor.ts`
- `utils/report-path.ts`

### Root fajlovi (5 fajlova)
- `auth.config.ts`
- `auth.ts`
- `middleware.ts`
- `schemas/index.ts`
- `mcp-server/src/index.ts`

---

## Detaljna analiza top 5 fajlova

### 1. schemas/index.ts (60 gresaka)

**Problem:** Index fajl re-exportuje iz podfajlova, ali ima neuskladjena imena.

**Greske:**
- Linija 80: `OperatorFormData` ne postoji u `operator.ts` (postoji `OperatorFormValues`)
- Linije 166-173: Analytics schema imena nisu nadjene (exportuju se preko `export *` ali se koriste i kao `z.infer` duplikati)
- Linije 176-180: Bulk service schema imena dupla referenca
- Linije 183-187: Complaint schema dupla referenca
- Linije 222-224: Parking service koristi TYPE umesto SCHEMA u `z.infer`

**Fix:** Ispraviti ime tipa na liniji 80, ukloniti duplirane `z.infer` type aliase koji se vec exportuju iz podfajlova, ispraviti parking-service reference.

---

### 2. mcp-server/src/index.ts (47 gresaka)

**Problem:** `args` parametar iz `request.params` nema type definiciju.

**Greske (po kategorijama):**
- 35x "args is possibly undefined" - pristup properties na netiovanom args
- 7x Type mismatch - `args.limit || 10` se tumaci kao `{} | 10`
- 3x Unknown type assertions - `args.query.toLowerCase()` na unknown tipu
- 2x Date constructor - `new Date(args.startDate)` sa unknown tipom

**Fix:** Dodati type guard za `args` sa defaultnom vrednoscu `= {}`, tipizirati svaki case sa odgovarajucim interfejsom, koristiti `String()` wrapper za Date konstruktor, tipizirati error u catch bloku.

---

### 3. components/complaints/ComplaintForm.tsx (43 greske)

**Problem:** Forma koristi polja `serviceType`, `humanitarianOrgId`, `parkingServiceId` koja ne postoje u `ComplaintSchema`.

**Greske (po kategorijama):**
- 11x Missing fields - polja ne postoje u schemi
- 16x Type mismatches na `form.watch()` - vraca pogresan tip za nepostojeca polja
- 9x FormField binding greske - cascade od schema mismatch-a
- 7x ostale - cascade greske

**Fix:** Dodati `serviceType`, `humanitarianOrgId`, `parkingServiceId` polja u `ComplaintSchema` u `schemas/complaint.ts`.

---

### 4. scripts/vas-import/PostpaidServiceProcessor.ts (30 gresaka)

**Problem:** Arhitekturalna neuskladjenost - kod pristupa Prisma modelima i property-ima koji ne postoje.

**Greske (po kategorijama):**
- 2x `prisma.vasServiceProvider` ne postoji (treba `prisma.provider`)
- 2x `prisma.vasServiceUsage` ne postoji
- 17x VasServiceRecord property mismatch (koristi `record.providerName`, `record.msisdn` itd. koji ne postoje)
- 1x Metod `processExcelFile` ne postoji (postoji `processPostpaidExcelFile`)
- 7x Return type ne odgovara `VasServiceFileProcessResult` interfejsu

**Fix:** Kompletna prerada mapiranja podataka - koristiti prave Prisma modele i polja iz VasServiceRecord interfejsa.

---

### 5. components/humanitarian-orgs/HumanitarianOrgForm.tsx (27 gresaka)

**Problem:** Schema definise polje kao `contactPerson`, ali komponenta koristi `contactName`.

**Greske:**
- 1x defaultValues koristi `contactName` umesto `contactPerson`
- 13x FormField control type mismatch (cascade)
- 1x Invalid field name u FormField
- 7x Input prop type mismatches (cascade)
- 2x Textarea prop type mismatches (cascade)
- 1x Submit handler type mismatch (cascade)

**Fix:** Promeniti `contactName` u `contactPerson` na 2 mesta (linija 52 i 136) - resava svih 27 gresaka.
