# Project Structure

```
fin-app-hub/
├── actions/
│   ├── analytics/
│   │   ├── get-complaint-stats.ts
│   │   ├── get-financial-data.ts
│   │   └── get-sales-metrics.ts
│   ├── blacklist/
│   │   ├── check-blacklisted-senders.ts
│   │   ├── create-blacklist-entry.ts
│   │   ├── delete-blacklist-entry.ts
│   │   ├── get-blacklist-logs.ts
│   │   └── update-blacklist-entry.ts
│   ├── bulk-services/
│   │   ├── create.ts
│   │   ├── delete.ts
│   │   ├── export.ts
│   │   ├── getAllBulkServices.ts
│   │   ├── getBulkServiceById.ts
│   │   ├── getBulkServices.ts
│   │   ├── getBulkServicesByProviderId.ts
│   │   ├── import.ts
│   │   ├── index.ts
│   │   └── update.ts
│   ├── complaints/
│   │   ├── assign.ts
│   │   ├── change-status.ts
│   │   ├── comment.ts
│   │   ├── create.ts
│   │   ├── delete.ts
│   │   ├── export.ts
│   │   ├── get-by-id.ts
│   │   ├── getServicesByProvider.ts
│   │   ├── humanitarian.ts
│   │   ├── import.ts
│   │   ├── parking.ts
│   │   ├── products.ts
│   │   ├── providers.ts
│   │   ├── services.ts
│   │   └── update.ts
│   ├── contracts/
│   │   ├── acknowledge-reminder.ts
│   │   ├── add-attachment.ts
│   │   ├── add-service.ts
│   │   ├── check-expiring.ts
│   │   ├── contract-actions.ts
│   │   ├── create-reminder.ts
│   │   ├── create.ts
│   │   ├── delete-attachment.ts
│   │   ├── delete.ts
│   │   ├── get-expiring-contracts-timeline.ts
│   │   ├── get-expiring-contracts.ts
│   │   ├── getProviderContractsForLinking.ts
│   │   ├── linkServiceToContract.ts
│   │   ├── remove-service.ts
│   │   ├── services.ts
│   │   └── update.ts
│   ├── humanitarian-orgs/
│   │   ├── create.ts
│   │   ├── delete.ts
│   │   ├── find-org-by-short-number.ts
│   │   ├── get.ts
│   │   ├── import-prepaid-transactions.ts
│   │   └── update.ts
│   ├── humanitarian-renewals/
│   │   ├── create.ts
│   │   ├── delete.ts
│   │   ├── list.ts
│   │   └── update.ts
│   ├── log/
│   │   ├── createLogEntry.ts
│   │   ├── getLogEntries.ts
│   │   └── updateLogStatus.ts
│   ├── notifications/
│   │   ├── get-by-user-id.ts
│   │   ├── get-preferences.ts
│   │   ├── get-unread-count.ts
│   │   ├── mark-as-read.ts
│   │   └── update-preferences.ts
│   ├── operators/
│   │   ├── create.ts
│   │   ├── delete.ts
│   │   ├── getAllOperators.ts
│   │   ├── getContractsByOperatorId.ts
│   │   ├── getOperatorById.ts
│   │   ├── getOperators.ts
│   │   ├── index.ts
│   │   └── update.ts
│   ├── organizations/
│   │   └── get-humanitarian.ts
│   ├── parking-services/
│   │   ├── create.ts
│   │   ├── delete.ts
│   │   ├── getActiveContractsCount.ts
│   │   ├── getAllParkingServices.ts
│   │   ├── getAvgDailyParkingRevenue.ts
│   │   ├── getContractsByParkingServiceId.ts
│   │   ├── getContractsCount.ts
│   │   ├── getMonthlyRevenueStats.ts
│   │   ├── getParkingServiceById.ts
│   │   ├── getParkingServices.ts
│   │   ├── getParkingServicesForReports.ts
│   │   ├── getParkingServiceStats.ts
│   │   ├── getServicesCount.ts
│   │   ├── getServicesForParkingServiceContracts.ts
│   │   ├── getTotalParkingRevenue.ts
│   │   ├── index.ts
│   │   ├── logReportSend.ts
│   │   └── update.ts
│   ├── products/
│   │   ├── delete.ts
│   │   ├── get-by-service.ts
│   │   ├── get.ts
│   │   └── update.ts
│   ├── providers/
│   │   ├── create.ts
│   │   ├── delete.ts
│   │   ├── get-by-service.ts
│   │   ├── get-providers.ts
│   │   ├── get.ts
│   │   ├── getAllProviders.ts
│   │   ├── getProviderDetails.ts
│   │   ├── getServicesForNewContracts.ts
│   │   └── update.ts
│   ├── reports/
│   │   ├── humanitarian/
│   │   │   ├── core/
│   │   │   ├── data/
│   │   │   ├── generators/
│   │   │   ├── utils/
│   │   │   ├── constants.ts
│   │   │   ├── index.ts
│   │   │   └── types.ts
│   │   ├── generate-all-humanitarian-reports.ts
│   │   ├── generate-excel.ts
│   │   ├── generate-humanitarian-templates.ts
│   │   ├── get-recent-reports.ts
│   │   ├── get-scheduled-reports.ts
│   │   ├── getReportFileNames.ts
│   │   ├── reset-monthly-counters.ts
│   │   ├── scan-all-reports.ts
│   │   ├── scan-unified-reports.ts
│   │   └── schedule-report.ts
│   ├── security/
│   │   ├── check-permission.ts
│   │   ├── get-distinct-entity-types.ts
│   │   ├── get-performance-metrics.ts
│   │   ├── log-event.ts
│   │   └── metrics.ts
│   ├── services/
│   │   ├── create.ts
│   │   ├── delete.ts
│   │   ├── export.ts
│   │   ├── get-by-category.ts
│   │   ├── get-parking-services.ts
│   │   ├── get.ts
│   │   ├── getAllServices.ts
│   │   ├── import.ts
│   │   ├── importVasData.ts
│   │   └── update.ts
│   ├── users/
│   │   ├── get-assignable-users.ts
│   │   └── user-role-management.ts
│   ├── admin.ts
│   ├── dashboard.ts
│   ├── login.ts
│   ├── logout.ts
│   ├── new-verification.ts
│   ├── password.ts
│   ├── register.ts
│   ├── reset.ts
│   └── settings.ts
├── app/
│   ├── (protected)/
│   │   ├── _components/
│   │   │   ├── floating-chat-button.tsx
│   │   │   ├── navbar.tsx
│   │   │   ├── newbar.tsx
│   │   │   ├── SessionWrapper.tsx
│   │   │   └── sidebar.tsx
│   │   ├── 403-1/
│   │   │   └── page.tsx
│   │   ├── 404/
│   │   │   └── page.tsx
│   │   ├── admin/
│   │   │   ├── aidash/
│   │   │   ├── complaints/
│   │   │   ├── notifications/
│   │   │   ├── security/
│   │   │   └── page.tsx
│   │   ├── analytics/
│   │   │   ├── complaints/
│   │   │   ├── financials/
│   │   │   ├── providers/
│   │   │   ├── sales/
│   │   │   ├── layout.tsx
│   │   │   ├── loading.tsx
│   │   │   └── page.tsx
│   │   ├── audit-logs/
│   │   │   └── page.tsx
│   │   ├── bulk-services/
│   │   │   ├── [id]/
│   │   │   ├── import/
│   │   │   ├── new/
│   │   │   └── page.tsx
│   │   ├── chat/
│   │   │   └── page.tsx
│   │   ├── client/
│   │   │   └── page.tsx
│   │   ├── complaints/
│   │   │   ├── [id]/
│   │   │   ├── new/
│   │   │   └── page.tsx
│   │   ├── contracts/
│   │   │   ├── [id]/
│   │   │   ├── expiring/
│   │   │   ├── import/
│   │   │   ├── new/
│   │   │   ├── providers/
│   │   │   ├── loading.tsx
│   │   │   └── page.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── help/
│   │   │   └── documentation/
│   │   ├── humanitarian-orgs/
│   │   │   ├── [id]/
│   │   │   ├── new/
│   │   │   └── page.tsx
│   │   ├── humanitarian-renewals/
│   │   │   └── page.tsx
│   │   ├── notifications/
│   │   │   ├── settings/
│   │   │   └── page.tsx
│   │   ├── operators/
│   │   │   ├── [id]/
│   │   │   ├── new/
│   │   │   └── page.tsx
│   │   ├── parking-services/
│   │   │   ├── [id]/
│   │   │   ├── new/
│   │   │   └── page.tsx
│   │   ├── products/
│   │   │   ├── [id]/
│   │   │   └── page.tsx
│   │   ├── profile/
│   │   │   └── page.tsx
│   │   ├── providers/
│   │   │   ├── [id]/
│   │   │   ├── new/
│   │   │   └── page.tsx
│   │   ├── reports/
│   │   │   ├── generate/
│   │   │   ├── scheduled/
│   │   │   └── page.tsx
│   │   ├── server/
│   │   │   └── page.tsx
│   │   ├── services/
│   │   │   ├── [serviceType]/
│   │   │   ├── import/
│   │   │   ├── new/
│   │   │   └── page.tsx
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   ├── test-boxloader/
│   │   │   └── page.tsx
│   │   ├── test-buttons/
│   │   │   └── page.tsx
│   │   ├── test-cube-loader/
│   │   │   └── page.tsx
│   │   ├── test-CubeLoader/
│   │   │   ├── CubeLoaderComponent.tsx
│   │   │   └── page.tsx
│   │   ├── test-nested-spinner/
│   │   │   └── page.tsx
│   │   ├── test-span-loader/
│   │   │   └── page.tsx
│   │   ├── test-svg-loader/
│   │   │   └── page.tsx
│   │   ├── folderi.txt
│   │   └── layout.tsx
│   ├── 403/
│   │   └── page.tsx
│   ├── api/
│   │   ├── admin/
│   │   │   ├── mcp/
│   │   │   └── route.ts
│   │   ├── analytics/
│   │   │   ├── financials/
│   │   │   └── sales/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   ├── blacklist/
│   │   │   └── route.ts
│   │   ├── bulk-services/
│   │   │   ├── [id]/
│   │   │   ├── export/
│   │   │   ├── import/
│   │   │   └── route.ts
│   │   ├── chat/
│   │   │   ├── context/
│   │   │   ├── database/
│   │   │   ├── database-simple/
│   │   │   └── route.ts
│   │   ├── complaints/
│   │   │   ├── [id]/
│   │   │   ├── export/
│   │   │   ├── statistics/
│   │   │   └── route.ts
│   │   ├── contracts/
│   │   │   ├── [id]/
│   │   │   ├── expiring/
│   │   │   ├── export/
│   │   │   ├── statistics/
│   │   │   ├── timeline/
│   │   │   └── route.ts
│   │   ├── cron/
│   │   │   └── check-expiring/
│   │   ├── emails/
│   │   │   └── upload/
│   │   ├── humanitarian-orgs/
│   │   │   ├── [id]/
│   │   │   └── route.ts
│   │   ├── humanitarian-renewals/
│   │   │   ├── [id]/
│   │   │   ├── statistics/
│   │   │   └── route.ts
│   │   ├── notifications/
│   │   │   ├── email/
│   │   │   ├── push/
│   │   │   └── route.ts
│   │   ├── operators/
│   │   │   ├── [id]/
│   │   │   ├── contracts/
│   │   │   └── route.ts
│   │   ├── organizations/
│   │   │   └── by-kratki-broj/
│   │   ├── outlook/
│   │   │   └── open-draft/
│   │   ├── parking-services/
│   │   │   ├── [id]/
│   │   │   ├── activity/
│   │   │   ├── parking-import/
│   │   │   ├── rename-file/
│   │   │   ├── reports/
│   │   │   ├── typescript-import/
│   │   │   ├── typescript-import-stream/
│   │   │   ├── upload/
│   │   │   └── route.ts
│   │   ├── products/
│   │   │   └── [id]/
│   │   ├── providers/
│   │   │   ├── [id]/
│   │   │   ├── by-name/
│   │   │   ├── upload/
│   │   │   ├── vas-import/
│   │   │   └── route.ts
│   │   ├── reports/
│   │   │   ├── generate/
│   │   │   ├── scan-unified/
│   │   │   ├── upload-humanitarian/
│   │   │   ├── upload-parking/
│   │   │   ├── upload-provider/
│   │   │   └── validate-system/
│   │   ├── security/
│   │   │   ├── logs/
│   │   │   ├── performance/
│   │   │   └── permissions/
│   │   ├── sender-blacklist/
│   │   │   └── route.ts
│   │   ├── services/
│   │   │   ├── [id]/
│   │   │   ├── bulk/
│   │   │   ├── categories/
│   │   │   ├── humanitarian/
│   │   │   ├── import/
│   │   │   ├── parking/
│   │   │   └── route.ts
│   │   ├── test/
│   │   │   └── route.ts
│   │   ├── users/
│   │   │   ├── [id]/
│   │   │   └── route.ts
│   │   └── vas-services/
│   │       ├── postpaid-import-stream/
│   │       └── upload/
│   ├── auth/
│   │   ├── error/
│   │   │   └── page.tsx
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── new-password/
│   │   │   └── page.tsx
│   │   ├── new-verification/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   ├── reset/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── fonts/
│   │   ├── GeistMonoVF.woff
│   │   └── GeistVF.woff
│   ├── test/
│   │   └── [testParam]/
│   │       └── page.tsx
│   ├── globals.css
│   ├── icon.png
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── analytics/
│   │   ├── AnomalyDetection.tsx
│   │   ├── CombinedFinancialView.tsx
│   │   ├── ComplaintAnalytics.tsx
│   │   ├── ContractAnalytics.tsx
│   │   ├── DataFilters.tsx
│   │   ├── FinancialOverview.tsx
│   │   ├── KpiDashboard.tsx
│   │   ├── ParkingFinancialOverview.tsx
│   │   ├── RevenueBreakdown.tsx
│   │   ├── SalesChart.tsx
│   │   ├── SalesOverview.tsx
│   │   ├── ServicePerformance.tsx
│   │   └── VasFinancialOverview.tsx
│   ├── audit-logs/
│   │   ├── AuditLogFilters.tsx
│   │   └── BlacklistAuditLogsClient.tsx
│   ├── auth/
│   │   ├── auth-loading.tsx
│   │   ├── back-button.tsx
│   │   ├── card-wrapper.tsx
│   │   ├── client-side-user-button.tsx
│   │   ├── error-card.tsx
│   │   ├── header.tsx
│   │   ├── login-button.tsx
│   │   ├── login-form.tsx
│   │   ├── logout-button.tsx
│   │   ├── new-password-form.tsx
│   │   ├── new-verification-form.tsx
│   │   ├── refresh-session-button.tsx
│   │   ├── register-form.tsx
│   │   ├── reset-form.tsx
│   │   ├── role-gate.tsx
│   │   ├── social.tsx
│   │   └── user-button.tsx
│   ├── blacklist/
│   │   ├── BlacklistFilters.tsx
│   │   ├── BlacklistSection.tsx
│   │   ├── CreateBlacklistEntryDialog.tsx
│   │   └── SenderBlacklistTable.tsx
│   ├── bulk-services/
│   │   ├── BulkServiceCard.tsx
│   │   ├── BulkServiceDetails.tsx
│   │   ├── BulkServiceFilters.tsx
│   │   ├── BulkServiceForm.tsx
│   │   ├── BulkServiceList.tsx
│   │   ├── BulkServiceStats.tsx
│   │   └── ImportForm.tsx
│   ├── complaints/
│   │   ├── charts/
│   │   │   ├── MonthlyComparisonChart.tsx
│   │   │   ├── ProviderPerformance.tsx
│   │   │   ├── ServiceCategoryBreakdown.tsx
│   │   │   ├── StatusChart.tsx
│   │   │   └── TrendChart.tsx
│   │   ├── reports/
│   │   │   ├── ExcelExport.tsx
│   │   │   └── KpiDashboard.tsx
│   │   ├── AmountSummary.tsx
│   │   ├── AssignComplaint.tsx
│   │   ├── CommentSection.tsx
│   │   ├── ComplaintFilters.tsx
│   │   ├── ComplaintForm.tsx
│   │   ├── ComplaintFormWrapper.tsx
│   │   ├── ComplaintList.tsx
│   │   ├── ComplaintTimeline.tsx
│   │   ├── CsvImport.tsx
│   │   ├── DateRangeFilter.tsx
│   │   ├── FileUpload.tsx
│   │   ├── NotificationBanner.tsx
│   │   ├── ProductSelection.tsx
│   │   ├── ProviderFilter.tsx
│   │   ├── ServiceCategoryFilter.tsx
│   │   ├── ServiceSelection.tsx
│   │   ├── StatisticsCard.tsx
│   │   └── StatusBadge.tsx
│   ├── contracts/
│   │   ├── category/
│   │   │   ├── HumanitarianContractCard.tsx
│   │   │   ├── ParkingContractCard.tsx
│   │   │   └── ProviderContractCard.tsx
│   │   ├── charts/
│   │   │   ├── ContractTypeDistribution.tsx
│   │   │   ├── ExpiryTimelineChart.tsx
│   │   │   └── RevenueProjection.tsx
│   │   ├── reports/
│   │   │   └── ContractKpiDashboard.tsx
│   │   ├── AttachmentList.tsx
│   │   ├── AttachmentUpload.tsx
│   │   ├── ContractDetails.tsx
│   │   ├── ContractFilters.tsx
│   │   ├── ContractForm.tsx
│   │   ├── ContractList.tsx
│   │   ├── ContractsSection.tsx
│   │   ├── ContractStatusBadge.tsx
│   │   ├── ContractStatusManager.tsx
│   │   ├── enhanced-contract-list.tsx
│   │   ├── ExpiryWarning.tsx
│   │   ├── ReminderForm.tsx
│   │   ├── renewal-dialog.tsx
│   │   ├── renewal-substatus-dialog.tsx
│   │   ├── RevenueBreakdown.tsx
│   │   ├── ServiceLinkToContractModal.tsx
│   │   ├── ServiceSelector.tsx
│   │   └── status-change-dialog.tsx
│   ├── dashboard/
│   │   ├── DashboardHeader.tsx
│   │   └── DashboardShell.tsx
│   ├── docs/
│   │   └── DocsSearch.tsx
│   ├── humanitarian-orgs/
│   │   ├── HumanitarianOrgContracts.tsx
│   │   ├── HumanitarianOrgDetails.tsx
│   │   ├── HumanitarianOrgFilters.tsx
│   │   ├── HumanitarianOrgForm.tsx
│   │   └── HumanitarianOrgList.tsx
│   ├── loading/
│   │   └── PageLoader.tsx
│   ├── logs/
│   │   └── LogFilters.tsx
│   ├── notifications/
│   │   ├── AdminNotificationControls.tsx
│   │   ├── AlertBanner.tsx
│   │   ├── EmailPreview.tsx
│   │   ├── NotificationBadge.tsx
│   │   ├── NotificationList.tsx
│   │   └── NotificationSettings.tsx
│   ├── operators/
│   │   ├── OperatorCard.tsx
│   │   ├── OperatorContracts.tsx
│   │   ├── OperatorDetails.tsx
│   │   ├── OperatorFilters.tsx
│   │   ├── OperatorForm.tsx
│   │   └── OperatorList.tsx
│   ├── parking-services/
│   │   ├── EmailActivityLog.tsx
│   │   ├── ParkingReportSender.tsx
│   │   ├── ParkingServiceCard.tsx
│   │   ├── ParkingServiceContracts.tsx
│   │   ├── ParkingServiceDetails.tsx
│   │   ├── ParkingServiceFilters.tsx
│   │   ├── ParkingServiceForm.tsx
│   │   ├── ParkingServiceList.tsx
│   │   ├── ParkingServiceReports.tsx
│   │   ├── ParkingServiceServicesOverview.tsx
│   │   └── ReportSelectorDialog.tsx
│   ├── products/
│   │   ├── ProductCard.tsx
│   │   ├── ProductDetails.tsx
│   │   ├── ProductFilters.tsx
│   │   ├── ProductForm.tsx
│   │   └── ProductList.tsx
│   ├── providers/
│   │   ├── ProviderCard.tsx
│   │   ├── ProviderContracts.tsx
│   │   ├── ProviderDetails.tsx
│   │   ├── ProviderFilters.tsx
│   │   ├── ProviderForm.tsx
│   │   ├── ProviderList.tsx
│   │   ├── ProviderListClient.tsx
│   │   ├── ProviderLogList.tsx
│   │   ├── ProviderServicesForContracts.tsx
│   │   └── ProviderServicesOverview.tsx
│   ├── reports/
│   │   ├── ClientGeneratedReport.tsx
│   │   ├── ExcelGenerator.tsx
│   │   ├── ExportOptions.tsx
│   │   ├── HumanitarianFileUploader.tsx
│   │   ├── HumanitarianPrepaidUploader.tsx
│   │   ├── HumanitarianTemplateGenerator.tsx
│   │   ├── MonthlyCounterReset.tsx
│   │   ├── ReportPreview.tsx
│   │   ├── ReportScanner.tsx
│   │   ├── ScheduleForm.tsx
│   │   ├── TemplateValidator.tsx
│   │   └── UnifiedReportsScanner.tsx
│   ├── security/
│   │   ├── ActivityLog.tsx
│   │   ├── ActivityLogTable.tsx
│   │   ├── APIResponseTimes.tsx
│   │   ├── BlackLogTable.tsx
│   │   ├── DatabasePerformance.tsx
│   │   ├── PerformanceMetrics.tsx
│   │   ├── PermissionGate.tsx
│   │   ├── RolePermissions.tsx
│   │   ├── SystemResources.tsx
│   │   └── UserRoleManagement.tsx
│   ├── services/
│   │   ├── category/
│   │   │   ├── BulkServiceCard.tsx
│   │   │   ├── HumanServiceCard.tsx
│   │   │   ├── ParkingServiceCard.tsx
│   │   │   └── VasServiceCard.tsx
│   │   ├── ImportForm.tsx
│   │   ├── ParkingServiceProcessorForm.tsx
│   │   ├── ProviderProcessorForm.tsx
│   │   ├── ServiceCard.tsx
│   │   ├── ServiceDetails.tsx
│   │   ├── ServiceFilters.tsx
│   │   ├── ServiceForm.tsx
│   │   ├── ServiceList.tsx
│   │   ├── ServiceStats.tsx
│   │   └── VasServiceProcessorForm.tsx
│   ├── skeletons/
│   │   ├── DetailSkeleton.tsx
│   │   ├── ListSkeleton.tsx
│   │   └── ProviderDetailSkeleton.tsx
│   ├── Table/
│   │   ├── PaginationControls.tsx
│   │   └── TableHeader.tsx
│   ├── toast/
│   │   ├── portal-toasty.tsx
│   │   └── toast-context.tsx
│   ├── ui/
│   │   ├── alert-dialog.tsx
│   │   ├── alert.tsx
│   │   ├── auth-loading.tsx
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── calendar.tsx
│   │   ├── card.tsx
│   │   ├── checkbox.tsx
│   │   ├── CubeLoader.css
│   │   ├── CubeLoader.tsx
│   │   ├── data-table-pagination.tsx
│   │   ├── date-picker.tsx
│   │   ├── date-range.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── empty-state.tsx
│   │   ├── form.tsx
│   │   ├── FullScreenLoader.tsx
│   │   ├── heading.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── loading-spinner.tsx
│   │   ├── nav-link.tsx
│   │   ├── navigation-menu.tsx
│   │   ├── nested-spinner.tsx
│   │   ├── pagination.tsx
│   │   ├── polished-button.tsx
│   │   ├── polished-link-button.tsx
│   │   ├── popover.tsx
│   │   ├── progress.tsx
│   │   ├── radio-group.tsx
│   │   ├── scroll-area.tsx
│   │   ├── select.tsx
│   │   ├── separator.tsx
│   │   ├── skeleton.tsx
│   │   ├── slider.tsx
│   │   ├── sonner.tsx
│   │   ├── span-loader.tsx
│   │   ├── spinner.tsx
│   │   ├── svg-path-loader.tsx
│   │   ├── switch.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   ├── textarea.tsx
│   │   ├── timeline.tsx
│   │   ├── toast.tsx
│   │   ├── tooltip.tsx
│   │   └── visually-hidden.tsx
│   ├── BackButton.tsx
│   ├── ChatBox.tsx
│   ├── ChatInterface.tsx
│   ├── EmptyState.tsx
│   ├── form-error.tsx
│   ├── form-success.tsx
│   ├── MarkdownViewer.tsx
│   ├── PageHeader.tsx
│   ├── SearchInput.tsx
│   ├── Table.tsx
│   ├── TableHelper.tsx
│   ├── theme-customizer.tsx
│   ├── theme-toggle.tsx
│   └── user-info.tsx
├── contexts/
│   └── theme-context.tsx
├── data/
│   ├── emails/
│   │   └── RE_ Re_ Re_ [#4310376-TicketID] (No subject).eml
│   ├── account.ts
│   ├── complaint.ts
│   ├── password-reset-token.ts
│   ├── two-factor-confirmation.ts
│   ├── two-factor-token.ts
│   ├── user.ts
│   └── verification-token.ts
├── docs/
│   ├── api/
│   │   ├── actions/
│   │   │   ├── admin/
│   │   │   ├── analytics/
│   │   │   ├── blacklist/
│   │   │   ├── bulk-services/
│   │   │   ├── complaints/
│   │   │   ├── contracts/
│   │   │   ├── dashboard/
│   │   │   ├── humanitarian-orgs/
│   │   │   ├── humanitarian-renewals/
│   │   │   ├── log/
│   │   │   ├── login/
│   │   │   ├── logout/
│   │   │   ├── new-verification/
│   │   │   ├── notifications/
│   │   │   ├── operators/
│   │   │   ├── organizations/
│   │   │   ├── parking-services/
│   │   │   ├── password/
│   │   │   ├── products/
│   │   │   ├── providers/
│   │   │   ├── register/
│   │   │   ├── reports/
│   │   │   ├── reset/
│   │   │   ├── security/
│   │   │   ├── services/
│   │   │   ├── settings/
│   │   │   └── users/
│   │   ├── components/
│   │   │   ├── analytics/
│   │   │   ├── audit-logs/
│   │   │   ├── auth/
│   │   │   ├── BackButton/
│   │   │   ├── blacklist/
│   │   │   ├── bulk-services/
│   │   │   ├── ChatBox/
│   │   │   ├── ChatInterface/
│   │   │   ├── complaints/
│   │   │   ├── contracts/
│   │   │   ├── dashboard/
│   │   │   ├── docs/
│   │   │   ├── EmptyState/
│   │   │   ├── form-error/
│   │   │   ├── form-success/
│   │   │   ├── humanitarian-orgs/
│   │   │   ├── loading/
│   │   │   ├── logs/
│   │   │   ├── MarkdownViewer/
│   │   │   ├── notifications/
│   │   │   ├── operators/
│   │   │   ├── PageHeader/
│   │   │   ├── parking-services/
│   │   │   ├── products/
│   │   │   ├── providers/
│   │   │   ├── reports/
│   │   │   ├── SearchInput/
│   │   │   ├── security/
│   │   │   ├── services/
│   │   │   ├── skeletons/
│   │   │   ├── Table/
│   │   │   ├── TableHelper/
│   │   │   ├── theme-customizer/
│   │   │   ├── theme-toggle/
│   │   │   ├── toast/
│   │   │   ├── ui/
│   │   │   └── user-info/
│   │   ├── hooks/
│   │   │   ├── use-bulk-services/
│   │   │   ├── use-check-blacklisted-senders/
│   │   │   ├── use-complaint-analytics/
│   │   │   ├── use-complaints/
│   │   │   ├── use-contract-analytics/
│   │   │   ├── use-contract-reminders/
│   │   │   ├── use-contracts/
│   │   │   ├── use-current-role/
│   │   │   ├── use-current-user/
│   │   │   ├── use-expiring-contracts/
│   │   │   ├── use-humanitarian-org-contracts/
│   │   │   ├── use-humanitarian-orgs/
│   │   │   ├── use-humanitarian-renewals/
│   │   │   ├── use-operators/
│   │   │   ├── use-parking-service-contracts/
│   │   │   ├── use-parking-services/
│   │   │   ├── use-performance-metrics/
│   │   │   ├── use-products/
│   │   │   ├── use-products-by-service/
│   │   │   ├── use-provider-contracts/
│   │   │   ├── use-provider-logs/
│   │   │   ├── use-providers/
│   │   │   ├── use-providers-by-service/
│   │   │   ├── use-revenue-breakdown/
│   │   │   ├── use-sales-data/
│   │   │   ├── use-sender-blacklist/
│   │   │   ├── use-service-categories/
│   │   │   ├── use-service-performance/
│   │   │   ├── use-service-stats/
│   │   │   ├── use-services/
│   │   │   ├── use-toast/
│   │   │   └── useDebounce/
│   │   ├── lib/
│   │   │   ├── actions/
│   │   │   ├── analytics/
│   │   │   ├── auth/
│   │   │   ├── bulk-services/
│   │   │   ├── cache/
│   │   │   ├── constants/
│   │   │   ├── contracts/
│   │   │   ├── data/
│   │   │   ├── db/
│   │   │   ├── docs/
│   │   │   ├── email/
│   │   │   ├── email-templates/
│   │   │   ├── exceptions/
│   │   │   ├── file-storage/
│   │   │   ├── formatters/
│   │   │   ├── humanitarian-orgs/
│   │   │   ├── humanitarian-report-parser/
│   │   │   ├── llm/
│   │   │   ├── mail/
│   │   │   ├── mcp/
│   │   │   ├── notifications/
│   │   │   ├── operators/
│   │   │   ├── outlook/
│   │   │   ├── parking-services/
│   │   │   ├── prisma/
│   │   │   ├── providers/
│   │   │   ├── pusher/
│   │   │   ├── reports/
│   │   │   ├── security/
│   │   │   ├── server-path-utils/
│   │   │   ├── services/
│   │   │   ├── session/
│   │   │   ├── storage/
│   │   │   ├── tokens/
│   │   │   ├── types/
│   │   │   ├── utils/
│   │   │   └── validations/
│   │   ├── schemas/
│   │   │   ├── analytics/
│   │   │   ├── auth/
│   │   │   ├── bulk-service/
│   │   │   ├── complaint/
│   │   │   ├── contract/
│   │   │   ├── contract-attachment/
│   │   │   ├── contract-reminder/
│   │   │   ├── humanitarian-org/
│   │   │   ├── humanitarian-renewal/
│   │   │   ├── notification/
│   │   │   ├── operator/
│   │   │   ├── parking-service/
│   │   │   ├── product/
│   │   │   ├── provider/
│   │   │   ├── security/
│   │   │   ├── service/
│   │   │   ├── type-aliases/
│   │   │   ├── variables/
│   │   │   └── README.md
│   │   └── README.md
│   ├── architecture/
│   │   ├── database.md
│   │   ├── folder-structure.md
│   │   └── overview.md
│   ├── docs-site/
│   │   ├── api/
│   │   ├── architecture/
│   │   │   ├── database.md
│   │   │   ├── folder-structure.md
│   │   │   └── overview.md
│   │   ├── blog/
│   │   │   ├── 2021-08-26-welcome/
│   │   │   ├── 2019-05-28-first-blog-post.md
│   │   │   ├── 2019-05-29-long-blog-post.md
│   │   │   ├── 2021-08-01-mdx-blog-post.mdx
│   │   │   ├── authors.yml
│   │   │   └── tags.yml
│   │   ├── docs/
│   │   │   ├── tutorial-basics/
│   │   │   ├── tutorial-extras/
│   │   │   └── intro.md
│   │   ├── features/
│   │   │   ├── complaints/
│   │   │   ├── contracts/
│   │   │   └── humanitarian/
│   │   ├── guides/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── css/
│   │   │   └── pages/
│   │   ├── static/
│   │   │   └── img/
│   │   ├── .gitignore
│   │   ├── docusaurus.config.ts
│   │   ├── package-lock.json
│   │   ├── package.json
│   │   ├── README.md
│   │   ├── sidebars.ts
│   │   └── tsconfig.json
│   ├── features/
│   │   ├── complaints/
│   │   ├── contracts/
│   │   │   └── overview.md
│   │   └── humanitarian/
│   ├── getting-started/
│   ├── guides/
│   ├── legacy/
│   ├── PROJECT_API_DOCUMENTATION.md
│   ├── PROJECT_API_STRUCTURE.md
│   ├── PROJECT_APP_CONTRACTS.md
│   └── README.md
├── generated-reports/
├── hooks/
│   ├── use-bulk-services.ts
│   ├── use-check-blacklisted-senders.ts
│   ├── use-complaint-analytics.ts
│   ├── use-complaints.ts
│   ├── use-contract-analytics.ts
│   ├── use-contract-reminders.ts
│   ├── use-contracts.ts
│   ├── use-current-role.ts
│   ├── use-current-user.ts
│   ├── use-expiring-contracts.ts
│   ├── use-humanitarian-org-contracts.ts
│   ├── use-humanitarian-orgs.ts
│   ├── use-humanitarian-renewals.ts
│   ├── use-operators.ts
│   ├── use-parking-service-contracts.ts
│   ├── use-parking-services.ts
│   ├── use-performance-metrics.ts
│   ├── use-products-by-service.ts
│   ├── use-products.ts
│   ├── use-provider-contracts.ts
│   ├── use-provider-logs.ts
│   ├── use-providers-by-service.ts
│   ├── use-providers.ts
│   ├── use-revenue-breakdown.ts
│   ├── use-sales-data.ts
│   ├── use-sender-blacklist.ts
│   ├── use-service-categories.ts
│   ├── use-service-performance.ts
│   ├── use-service-stats.ts
│   ├── use-services.ts
│   ├── use-toast.ts
│   └── useDebounce.ts
├── lib/
│   ├── actions/
│   │   ├── contracts/
│   │   │   └── contract-actions.ts
│   │   ├── complaints.ts
│   │   ├── contract-actions.ts
│   │   ├── debug-session.ts
│   │   ├── products.ts
│   │   └── report.actions.ts
│   ├── analytics/
│   │   ├── financial-calculations.ts
│   │   └── revenue-utils.ts
│   ├── auth/
│   │   ├── adapters/
│   │   │   └── listAuthenticatorsByUserId.ts
│   │   └── auth-utils.ts
│   ├── bulk-services/
│   │   ├── csv-processor.ts
│   │   ├── statistics.ts
│   │   └── validators.ts
│   ├── cache/
│   │   ├── config.ts
│   │   ├── memory-cache.ts
│   │   ├── redis.ts
│   │   └── revalidate.ts
│   ├── contracts/
│   │   ├── expiration-checker.ts
│   │   ├── notification-sender.ts
│   │   ├── pdf-generator.ts
│   │   ├── reminder-scheduler.ts
│   │   ├── revenue-calculator.ts
│   │   └── validators.ts
│   ├── data/
│   │   ├── humanitarian-orgs.ts
│   │   ├── parking-services.ts
│   │   └── providers.ts
│   ├── email/
│   │   ├── outlook-local.ts
│   │   └── outlook-smtp.ts
│   ├── email-templates/
│   │   └── parking-report-email.ts
│   ├── humanitarian-orgs/
│   │   └── validators.ts
│   ├── llm/
│   │   └── fallback.ts
│   ├── mcp/
│   │   ├── ai-context-builder.ts
│   │   ├── ai-prompt.ts
│   │   ├── ai-response-formatter.ts
│   │   ├── email-tools.ts
│   │   ├── index.ts
│   │   ├── internal-server.ts
│   │   ├── query-logger.ts
│   │   ├── read-operations.ts
│   │   ├── README.md
│   │   ├── server.ts
│   │   ├── types.ts
│   │   └── write-tools.ts
│   ├── notifications/
│   │   ├── anomaly-alert.ts
│   │   ├── complaint-status.ts
│   │   ├── cron-alerts.ts
│   │   ├── email-sender.ts
│   │   ├── in-app-notifier.ts
│   │   └── templates.ts
│   ├── operators/
│   │   └── validators.ts
│   ├── parking-services/
│   │   └── validators.ts
│   ├── providers/
│   │   └── validators.ts
│   ├── reports/
│   │   ├── excel-generator.ts
│   │   └── scheduled-jobs.ts
│   ├── security/
│   │   ├── audit-logger.ts
│   │   ├── auth-helpers.ts
│   │   ├── backup-service.ts
│   │   ├── black-log.ts
│   │   ├── permission-checker.ts
│   │   ├── permissions.ts
│   │   └── rate-limiter.ts
│   ├── services/
│   │   ├── activity-log-service.ts
│   │   ├── constants.ts
│   │   ├── csv-processor.ts
│   │   └── statistics.ts
│   ├── types/
│   │   ├── analytics-types.ts
│   │   ├── blacklist.ts
│   │   ├── bulk-service-types.ts
│   │   ├── complaint-types.ts
│   │   ├── contract-status.ts
│   │   ├── contract-types.ts
│   │   ├── csv-types.ts
│   │   ├── dashboard.ts
│   │   ├── enums.ts
│   │   ├── humanitarian-org-types.ts
│   │   ├── humanitarian-renewal-types.ts
│   │   ├── interfaces.ts
│   │   ├── log-types.ts
│   │   ├── notification-types.ts
│   │   ├── operator-types.ts
│   │   ├── parking-service-types.ts
│   │   ├── product-types.ts
│   │   ├── provider-types.ts
│   │   ├── security-types.ts
│   │   ├── service-types.ts
│   │   └── ui-notification-types.ts
│   ├── validations/
│   │   └── dashboard.ts
│   ├── auth.ts
│   ├── constants.ts
│   ├── db.ts
│   ├── docs.ts
│   ├── exceptions.ts
│   ├── file-storage.ts
│   ├── formatters.ts
│   ├── humanitarian-report-parser.ts
│   ├── mail.ts
│   ├── outlook.ts
│   ├── prisma.ts
│   ├── providers.ts
│   ├── pusher.ts
│   ├── server-path-utils.ts
│   ├── session.ts
│   ├── storage.ts
│   ├── tokens.ts
│   ├── tools-description.json
│   └── utils.ts
├── mcp-server/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   └── index.ts
│   ├── package-lock.json
│   ├── package.json
│   └── tsconfig.json
├── mintara/
├── prisma/
│   ├── migrations/
│   │   ├── 20250613181656_der/
│   │   │   └── migration.sql
│   │   ├── 20250615202353_dd/
│   │   │   └── migration.sql
│   │   ├── 20250923123441_nik/
│   │   │   └── migration.sql
│   │   ├── 20250924133404_add_report_type_to_report_file/
│   │   │   └── migration.sql
│   │   ├── 20250925073217_add_is_monthly_report_to_reportfile/
│   │   │   └── migration.sql
│   │   ├── 20251009100617_add_query_log/
│   │   │   └── migration.sql
│   │   ├── 20251010093739_add_description_to_activitylog/
│   │   │   └── migration.sql
│   │   └── migration_lock.toml
│   └── schema.prisma
├── public/
│   ├── images/
│   │   └── providers/
│   │       ├── infobip.png
│   │       ├── oneclick.png
│   │       └── slika-nth.png
│   ├── parking-service/
│   │   ├── aleksandrovac/
│   │   │   └── report/
│   │   ├── aleksinac/
│   │   │   └── report/
│   │   ├── aran/
│   │   │   └── report/
│   │   ├── batocina/
│   │   │   └── report/
│   │   ├── bbasta/
│   │   │   └── report/
│   │   ├── becej/
│   │   │   └── report/
│   │   ├── belacrkva/
│   │   │   └── report/
│   │   ├── bor/
│   │   │   └── report/
│   │   ├── bpalanka/
│   │   │   └── report/
│   │   ├── brus/
│   │   │   └── report/
│   │   ├── bujanovac/
│   │   │   └── report/
│   │   ├── cacak/
│   │   │   └── report/
│   │   ├── cuprija/
│   │   │   └── report/
│   │   ├── despotovac/
│   │   │   └── report/
│   │   ├── dimitrovgrad/
│   │   │   └── report/
│   │   ├── gmilanovac/
│   │   │   └── report/
│   │   ├── golubac/
│   │   │   └── report/
│   │   ├── imladenovac/
│   │   │   └── report/
│   │   ├── indjija/
│   │   │   └── report/
│   │   ├── ivanjica/
│   │   │   └── report/
│   │   ├── jagodina/
│   │   │   └── report/
│   │   ├── kikinda/
│   │   │   └── report/
│   │   ├── knjazevac/
│   │   │   └── report/
│   │   ├── kopaonik/
│   │   │   └── report/
│   │   ├── kragujevac/
│   │   │   └── report/
│   │   ├── kraljevo/
│   │   │   └── report/
│   │   ├── krupanj/
│   │   │   └── report/
│   │   ├── krusevac/
│   │   │   └── report/
│   │   ├── kucevo/
│   │   │   └── report/
│   │   ├── kursumlija/
│   │   │   └── report/
│   │   ├── lapovo/
│   │   │   └── report/
│   │   ├── lazarevac/
│   │   │   └── report/
│   │   ├── leskovac/
│   │   │   └── report/
│   │   ├── ljig/
│   │   │   └── report/
│   │   ├── ljubovija/
│   │   │   └── report/
│   │   ├── loznica/
│   │   │   └── report/
│   │   ├── mionica/
│   │   │   └── report/
│   │   ├── mtskim/
│   │   │   └── report/
│   │   ├── negotin/
│   │   │   └── report/
│   │   ├── nis/
│   │   │   └── report/
│   │   ├── novisad/
│   │   │   └── report/
│   │   ├── npazar/
│   │   │   └── report/
│   │   ├── obrenovac/
│   │   │   └── report/
│   │   ├── osecina/
│   │   │   └── report/
│   │   ├── pancevo/
│   │   │   └── report/
│   │   ├── paracin/
│   │   │   └── report/
│   │   ├── pecinci/
│   │   │   └── report/
│   │   ├── petrovacnm/
│   │   │   └── report/
│   │   ├── pirot/
│   │   │   └── report/
│   │   ├── pozarevac/
│   │   │   └── report/
│   │   ├── pozega/
│   │   │   └── report/
│   │   ├── presevo/
│   │   │   └── report/
│   │   ├── prokuplje/
│   │   │   └── report/
│   │   ├── ps/
│   │   │   └── report/
│   │   ├── raska/
│   │   │   └── report/
│   │   ├── ruma/
│   │   │   └── report/
│   │   ├── sabac/
│   │   │   └── report/
│   │   ├── sbanja/
│   │   │   └── report/
│   │   ├── senta/
│   │   │   └── report/
│   │   ├── sid/
│   │   │   └── report/
│   │   ├── sjenica/
│   │   │   └── report/
│   │   ├── skarlovci/
│   │   │   └── report/
│   │   ├── smederevo/
│   │   │   └── report/
│   │   ├── smitrovica/
│   │   │   └── report/
│   │   ├── sombor/
│   │   │   └── report/
│   │   ├── spalanka/
│   │   │   └── report/
│   │   ├── starapazova/
│   │   │   └── report/
│   │   ├── subotica/
│   │   │   └── report/
│   │   ├── surcin/
│   │   │   └── report/
│   │   ├── svilajnac/
│   │   │   └── report/
│   │   ├── temerin/
│   │   │   └── report/
│   │   ├── topola/
│   │   │   └── report/
│   │   ├── trstenik/
│   │   │   └── report/
│   │   ├── ub/
│   │   │   └── report/
│   │   ├── uzice/
│   │   │   └── report/
│   │   ├── valjevo/
│   │   │   └── report/
│   │   ├── velikaplana/
│   │   │   └── report/
│   │   ├── velikogradiste/
│   │   │   └── report/
│   │   ├── vlasotince/
│   │   │   └── report/
│   │   ├── vranje/
│   │   │   └── report/
│   │   ├── vrbas/
│   │   │   └── report/
│   │   ├── vrnjacka/
│   │   │   └── report/
│   │   ├── vrsac/
│   │   │   └── report/
│   │   ├── zajecar/
│   │   │   └── report/
│   │   └── zrenjanin/
│   │       └── report/
│   ├── providers/
│   │   ├── 17600/
│   │   │   └── reports/
│   │   ├── akton/
│   │   │   └── reports/
│   │   ├── COMTRADEITSS/
│   │   │   └── reports/
│   │   ├── INFOBIP/
│   │   │   └── reports/
│   │   ├── jp-posta/
│   │   │   └── reports/
│   │   ├── MKONEKT/
│   │   │   └── reports/
│   │   ├── MOND/
│   │   │   └── reports/
│   │   ├── NPAY/
│   │   │   └── reports/
│   │   ├── NTH/
│   │   │   └── reports/
│   │   ├── ONECLICKSOLUTIONS/
│   │   │   └── reports/
│   │   └── processcom/
│   │       └── reports/
│   └── reports/
│       ├── 1033 - Eparhija raško-prizrenska/
│       │   ├── 2025/
│       │   └── 2026/
│       ├── 1150 - Национално удружење родитеља деце оболеле од рака-НУРДОР/
│       │   ├── 2025/
│       │   └── 2026/
│       ├── 1389 - Удружење „Српска Солидарност“/
│       │   ├── 2025/
│       │   └── 2026/
│       ├── 1733 - Хуманитарна организација Принцип/
│       │   ├── 2025/
│       │   └── 2026/
│       ├── 1817 - Фондација ДЕЛИЈЕ/
│       │   ├── 2025/
│       │   └── 2026/
│       ├── 2407 - Фондација – Хуманост без граница/
│       │   ├── 2025/
│       │   └── 2026/
│       ├── 2552 - Блиц Фондација/
│       │   ├── 2025/
│       │   └── 2026/
│       ├── 2844 - Верско добротворно старатељство Архиепископије београдско-карловачке СПЦ/
│       │   ├── 2025/
│       │   └── 2026/
│       ├── 3008 - Добро памтим све/
│       │   ├── 2025/
│       │   └── 2026/
│       ├── 3018 - Епархија нишка „Добри Самарјанин“/
│       │   ├── 2025/
│       │   └── 2026/
│       ├── 3023 - Фондација „ХЕРОЈИ БЕОГРАДСКОГ МАРАТОНА“/
│       │   ├── 2025/
│       │   └── 2026/
│       ├── 3027 - Humanitarna fondacija ZA NAŠE HEROJE/
│       │   ├── 2025/
│       │   └── 2026/
│       ├── 3030 - Фондација „ Буди хуман - Александар Шапић“/
│       │   ├── 2025/
│       │   └── 2026/
│       ├── 3042 - Фондација Мало срце/
│       │   └── 2026/
│       ├── 3045 - Хуманитарно удружење Дечији осмех/
│       │   ├── 2025/
│       │   └── 2026/
│       ├── 3051 - Удружење ТЕЛОК/
│       │   ├── 2025/
│       │   └── 2026/
│       ├── 3059 - Svetionik/
│       │   ├── 2025/
│       │   └── 2026/
│       ├── 3066 - ФОНДАЦИЈА ПОМОЗИСРЦЕМ/
│       │   ├── 2025/
│       │   └── 2026/
│       ├── 3091 - Фондација Једро/
│       │   ├── 2025/
│       │   └── 2026/
│       ├── 3132 - Чеп за хендикеп - Зрењанин/
│       │   ├── 2025/
│       │   └── 2026/
│       ├── 3800 - Хуманитарна организација „Покрени живот“/
│       │   ├── 2025/
│       │   └── 2026/
│       ├── 3808 - Udruženje Debra/
│       │   ├── 2025/
│       │   └── 2026/
│       ├── 3828 - Fondacija Anja Radonjić/
│       │   ├── 2025/
│       │   └── 2026/
│       ├── 3855 - Хуманитарна организација „Заједно можемо - Марко Николић“/
│       │   ├── 2025/
│       │   └── 2026/
│       ├── 3859 - Posebna Spasilačka jedinica/
│       │   ├── 2025/
│       │   └── 2026/
│       ├── 4030 - Хуманитарна организација Сви за Космет/
│       │   ├── 2025/
│       │   └── 2026/
│       ├── 4334 - Фондација Заједно за младе/
│       │   ├── 2025/
│       │   └── 2026/
│       ├── 5757 - Фондација „Подржи живот“/
│       │   ├── 2025/
│       │   └── 2026/
│       ├── 5800 - Фондација Тамара Мисирлић/
│       │   ├── 2025/
│       │   └── 2026/
│       ├── 6333 - Удружење Подели радост/
│       │   ├── 2025/
│       │   └── 2026/
│       ├── 6880 - Фондација ТАТЕ НОВОСАЂАНИ/
│       │   ├── 2025/
│       │   └── 2026/
│       ├── 7175 - Udruženje UVEK SA DECOM/
│       │   ├── 2025/
│       │   └── 2026/
│       ├── 7323 - Фондација српских бораца/
│       │   ├── 2025/
│       │   └── 2026/
│       ├── 7763 - Хуманитарна организација „Срби за Србе“/
│       │   ├── 2025/
│       │   └── 2026/
│       ├── 9656 - УНИЦЕФ/
│       │   ├── 2025/
│       │   └── 2026/
│       ├── prepaid/
│       └── unified/
├── reports/
│   ├── 04c9ed51-82db-41dd-9bf0-ce7ac725b528/
│   │   └── 2025/
│   │       ├── 08/
│   │       └── 09/
│   ├── 0559f853-2aa3-46e6-b130-e1c5ead46e8b/
│   │   └── 2025/
│   │       ├── 08/
│   │       ├── 09/
│   │       ├── 10/
│   │       └── 11/
│   ├── 06dfc40b-3c0a-40a0-98d5-826cb18805a6/
│   │   └── 2025/
│   │       ├── 03/
│   │       ├── 05/
│   │       ├── 08/
│   │       └── 09/
│   ├── 08e86bcc-1862-4ece-b516-8c1211cbb3bd/
│   │   └── 2026/
│   │       └── 01/
│   ├── 0f729e92-1e5f-424a-bd27-e1ed68ad4e77/
│   │   └── 2025/
│   │       ├── 03/
│   │       ├── 05/
│   │       ├── 08/
│   │       └── 09/
│   ├── 12fd14e4-b354-4d2e-b26b-12da0403d0b8/
│   │   └── 2025/
│   │       ├── 08/
│   │       ├── 09/
│   │       └── 10/
│   ├── 19810e02-2889-4ee4-9cfc-561a56497168/
│   │   └── 2025/
│   │       ├── 03/
│   │       ├── 05/
│   │       ├── 08/
│   │       └── 09/
│   ├── 2042ff4c-b59f-4954-8bf9-1780ce910ab9/
│   │   └── 2025/
│   │       ├── 08/
│   │       ├── 09/
│   │       ├── 10/
│   │       └── 11/
│   ├── 2206d8f6-0344-4d99-9d2d-ab5198876f65/
│   │   └── 2025/
│   │       ├── 08/
│   │       ├── 09/
│   │       ├── 10/
│   │       └── 11/
│   ├── 276d50f7-c7d7-4511-8b46-2b3f1a6adfe3/
│   │   └── 2025/
│   │       ├── 08/
│   │       ├── 09/
│   │       ├── 10/
│   │       └── 11/
│   ├── 2bd8e603-24f7-440c-8106-9ba3ac84156d/
│   │   └── 2025/
│   │       ├── 03/
│   │       ├── 05/
│   │       ├── 08/
│   │       └── 09/
│   ├── 2cd80e3b-2290-4fc9-a996-56ae00ed448a/
│   │   └── 2025/
│   │       ├── 03/
│   │       ├── 05/
│   │       ├── 08/
│   │       └── 09/
│   ├── 2d00bfcc-4fe8-4427-84c1-cacda4c93543/
│   │   └── 2025/
│   │       ├── 08/
│   │       ├── 09/
│   │       ├── 10/
│   │       └── 11/
│   ├── 321064ac-38fa-4f5e-87c0-1ecd1e8c6a26/
│   │   └── 2025/
│   │       ├── 08/
│   │       ├── 09/
│   │       ├── 10/
│   │       └── 11/
│   ├── 32cfa4fc-86db-4931-8025-23a5fb0404ce/
│   │   └── 2026/
│   │       └── 01/
│   ├── 333d2a49-03d1-44a8-b7c1-b4d0264ea5ac/
│   │   └── 2025/
│   │       ├── 08/
│   │       └── 09/
│   ├── 3707cd0b-9b8e-4d3c-8450-f2c60686dfa3/
│   │   └── 2025/
│   │       ├── 08/
│   │       ├── 09/
│   │       ├── 10/
│   │       └── 11/
│   ├── 3b8e2bf3-3ea7-4add-b3d5-7454921c3e27/
│   │   └── 2026/
│   │       └── 01/
│   ├── 3ed9a2f9-054a-40d7-ac8b-c961684af7ba/
│   │   └── 2025/
│   │       ├── 08/
│   │       ├── 09/
│   │       ├── 10/
│   │       └── 11/
│   ├── 403679ad-877c-46bf-9325-9eb7f55a0bc0/
│   │   └── 2025/
│   │       ├── 03/
│   │       ├── 05/
│   │       ├── 08/
│   │       └── 09/
│   ├── 42baadb1-89d2-493c-acaf-6dd20c9bb0d0/
│   │   └── 2025/
│   │       ├── 08/
│   │       ├── 09/
│   │       ├── 10/
│   │       └── 11/
│   ├── 4507169d-a9cc-4cd7-89a0-d04f970b5e79/
│   │   └── 2025/
│   │       ├── 08/
│   │       └── 09/
│   ├── 502ead2a-8599-41d1-9fa2-1f691063ce9d/
│   │   └── 2025/
│   │       ├── 08/
│   │       ├── 09/
│   │       ├── 10/
│   │       └── 11/
│   ├── 567625e9-afe2-41ba-8418-675d072f2d6b/
│   │   └── 2025/
│   │       ├── 03/
│   │       ├── 05/
│   │       ├── 08/
│   │       └── 09/
│   ├── 5a81520b-55db-4c54-b91c-6ff9f3103620/
│   │   └── 2025/
│   │       ├── 03/
│   │       ├── 05/
│   │       ├── 08/
│   │       └── 09/
│   ├── 625b8cb9-5296-4377-bb9c-ac94b6deb726/
│   │   └── 2025/
│   │       ├── 08/
│   │       └── 09/
│   ├── 6bee887f-a149-43ea-be6e-f6573d9391c9/
│   │   └── 2025/
│   │       ├── 08/
│   │       ├── 09/
│   │       ├── 10/
│   │       └── 11/
│   ├── 6fdb8991-9efe-4d9a-ad0f-4d3a02433275/
│   │   └── 2025/
│   │       ├── 08/
│   │       └── 09/
│   ├── 70915ea9-e187-49e9-9444-97d08f081b01/
│   │   └── 2025/
│   │       ├── 08/
│   │       └── 09/
│   ├── 7e7d3d99-15d6-423b-862a-cb8321a99081/
│   │   └── 2026/
│   │       └── 01/
│   ├── 7e824c80-d345-45dc-b7c0-9e86f8a04638/
│   │   └── 2025/
│   │       ├── 08/
│   │       ├── 09/
│   │       ├── 10/
│   │       └── 11/
│   ├── 7fa36d83-7a24-4ab4-ba11-0d76130786bb/
│   │   └── 2026/
│   │       └── 01/
│   ├── 8a122ac9-35bb-4f45-b583-214d7aa7db0f/
│   │   └── 2025/
│   │       ├── 03/
│   │       ├── 05/
│   │       ├── 08/
│   │       └── 09/
│   ├── 8eb8d5db-18ef-49b9-a93f-d6d764845cfa/
│   │   └── 2025/
│   │       ├── 03/
│   │       ├── 05/
│   │       ├── 08/
│   │       └── 09/
│   ├── 93505b6f-d48a-47a1-ab94-81c58a1742d2/
│   │   └── 2025/
│   │       ├── 08/
│   │       └── 09/
│   ├── 957ad187-fc94-4399-873b-3996d456e6e0/
│   │   └── 2025/
│   │       ├── 03/
│   │       ├── 05/
│   │       ├── 08/
│   │       └── 09/
│   ├── 9f684b75-d7c3-4182-81b0-aab6bdc3e0d9/
│   │   └── 2025/
│   │       ├── 03/
│   │       ├── 05/
│   │       ├── 08/
│   │       └── 09/
│   ├── a6eb8377-13cf-427a-95fb-197ae88a32c2/
│   │   └── 2026/
│   │       └── 01/
│   ├── a7708465-7adb-43f7-8f16-32a539e2ff08/
│   │   └── 2025/
│   │       ├── 08/
│   │       ├── 09/
│   │       ├── 10/
│   │       └── 11/
│   ├── aa0bcc92-6099-4da2-b59c-6412706c08a4/
│   │   └── 2025/
│   │       ├── 03/
│   │       ├── 05/
│   │       ├── 08/
│   │       └── 09/
│   ├── aa8db104-deab-44ed-a533-0ffd4f4684d6/
│   │   └── 2025/
│   │       ├── 03/
│   │       ├── 05/
│   │       ├── 08/
│   │       └── 09/
│   ├── abfce187-f472-4130-8e3a-6d3b099d2b00/
│   │   └── 2026/
│   │       └── 01/
│   ├── acb2e48b-58c5-4858-83a8-e1cc27f150e2/
│   │   └── 2025/
│   │       ├── 08/
│   │       └── 09/
│   ├── ae67fa55-fb6b-48de-ab53-712cc4eb9e6b/
│   │   └── 2025/
│   │       ├── 03/
│   │       ├── 05/
│   │       ├── 08/
│   │       └── 09/
│   ├── b42af6e2-0a79-4008-be47-d7ef4a257e5a/
│   │   └── 2025/
│   │       ├── 03/
│   │       ├── 05/
│   │       ├── 08/
│   │       └── 09/
│   ├── b60b9287-6fbd-461d-ad83-9168fa71b35e/
│   │   └── 2025/
│   │       ├── 03/
│   │       ├── 05/
│   │       ├── 08/
│   │       └── 09/
│   ├── b7ee79ce-ceeb-494b-a9ad-83c6b8795acd/
│   │   └── 2025/
│   │       ├── 08/
│   │       ├── 09/
│   │       ├── 10/
│   │       └── 11/
│   ├── bc435c56-92be-4360-bcc3-987dc1e38791/
│   │   └── 2026/
│   │       └── 01/
│   ├── be6eb534-f559-4c86-898e-ab2dfef030d7/
│   │   └── 2025/
│   │       ├── 03/
│   │       ├── 05/
│   │       ├── 08/
│   │       └── 09/
│   ├── bf68e2c3-0c83-49e2-937e-42e740d294cc/
│   │   └── 2025/
│   │       ├── 08/
│   │       └── 09/
│   ├── c39b1959-7258-4935-b9e6-d81e8f4e70cf/
│   │   └── 2026/
│   │       └── 01/
│   ├── c3b8005a-e3ef-452e-81c8-d53bf70a0a00/
│   │   └── 2025/
│   │       ├── 08/
│   │       ├── 09/
│   │       ├── 10/
│   │       └── 11/
│   ├── c4c95982-5df8-4baf-83c8-245b7bab8778/
│   │   └── 2025/
│   │       ├── 03/
│   │       ├── 05/
│   │       ├── 08/
│   │       └── 09/
│   ├── c4eaa98c-c189-44f3-91fe-e7556798e6a4/
│   │   └── 2025/
│   │       ├── 03/
│   │       ├── 05/
│   │       ├── 08/
│   │       └── 09/
│   ├── c70e9b76-5fef-4a0e-9ff7-c08959b5a67a/
│   │   └── 2025/
│   │       ├── 08/
│   │       ├── 09/
│   │       ├── 10/
│   │       └── 11/
│   ├── c76ea4db-36af-4dab-871f-bb94f916c65f/
│   │   └── 2025/
│   │       ├── 08/
│   │       ├── 09/
│   │       ├── 10/
│   │       └── 11/
│   ├── cadcc3bd-4dda-4328-a6d9-e1a60ed73327/
│   │   └── 2025/
│   │       ├── 03/
│   │       ├── 05/
│   │       ├── 08/
│   │       └── 09/
│   ├── cme9yo328000h9qwgg1fm0gid/
│   │   └── 2025/
│   │       ├── 03/
│   │       ├── 05/
│   │       ├── 08/
│   │       └── 09/
│   ├── cmg0rc89s003070n4xpnad782/
│   │   └── 2025/
│   │       ├── 10/
│   │       └── 11/
│   ├── d028562e-a622-4e5a-85fb-d9b9cff4707e/
│   │   └── 2025/
│   │       ├── 08/
│   │       └── 09/
│   ├── d2205201-2917-43e9-a4d4-db55c2280a39/
│   │   └── 2025/
│   │       ├── 08/
│   │       ├── 09/
│   │       ├── 10/
│   │       └── 11/
│   ├── d4a7e0fa-1e88-45c7-9cee-a0edfd0025d4/
│   │   └── 2026/
│   │       └── 01/
│   ├── d8e90899-d1fc-474f-b015-c0ea00fd69a1/
│   │   └── 2026/
│   │       └── 01/
│   ├── d943f5f9-b72f-4657-bf4d-2691a2d0d64f/
│   │   └── 2025/
│   │       ├── 03/
│   │       ├── 05/
│   │       ├── 08/
│   │       └── 09/
│   ├── df0c7d4a-d603-4598-8e8f-78b1a6beac1c/
│   │   └── 2026/
│   │       └── 01/
│   ├── e022c747-211d-4db0-b063-e4708ad06eda/
│   │   └── 2026/
│   │       └── 01/
│   ├── e0972c6f-5759-4b7a-9f56-05c3b96dccd8/
│   │   └── 2025/
│   │       ├── 03/
│   │       ├── 05/
│   │       ├── 08/
│   │       └── 09/
│   ├── e2186370-90ef-4b61-8af6-01405d07c2de/
│   │   └── 2026/
│   │       └── 01/
│   ├── e65b1e03-1696-4bc8-94cc-c6d7a333b129/
│   │   └── 2025/
│   │       ├── 03/
│   │       ├── 05/
│   │       ├── 08/
│   │       └── 09/
│   ├── e99e9ddf-2569-4691-9a36-350cecf6baf6/
│   │   └── 2025/
│   │       ├── 03/
│   │       ├── 05/
│   │       ├── 08/
│   │       └── 09/
│   ├── ed422bc3-23b6-4a7b-a2ca-491c6af0c108/
│   │   └── 2025/
│   │       ├── 03/
│   │       ├── 05/
│   │       ├── 08/
│   │       └── 09/
│   ├── f261dcc9-3f6b-4db6-a488-cf50f164ccdd/
│   │   └── 2025/
│   │       ├── 08/
│   │       └── 09/
│   ├── f301ad1f-def9-4a4d-82a2-c22060cf1e22/
│   │   └── 2025/
│   │       ├── 03/
│   │       ├── 05/
│   │       ├── 08/
│   │       └── 09/
│   ├── f47f183b-1191-4afc-9c64-80f12a04fd5f/
│   │   └── 2025/
│   │       ├── 03/
│   │       ├── 05/
│   │       ├── 08/
│   │       └── 09/
│   ├── f4e95486-7501-4483-906c-43ad6f809c80/
│   │   └── 2026/
│   │       └── 01/
│   ├── f674814a-1603-4cb3-a1e6-9a004ff196c7/
│   │   └── 2026/
│   │       └── 01/
│   ├── fa79b7af-ac4d-4596-bee5-14a45ebf2413/
│   │   └── 2025/
│   │       ├── 03/
│   │       ├── 05/
│   │       ├── 08/
│   │       └── 09/
│   ├── fd0e0657-9dee-4923-bc8e-319996a08cb6/
│   │   └── 2025/
│   │       ├── 03/
│   │       ├── 05/
│   │       ├── 08/
│   │       └── 09/
│   └── global-counters/
│       ├── 2025/
│       │   ├── 05/
│       │   ├── 07/
│       │   ├── 08/
│       │   ├── 09/
│       │   ├── 10/
│       │   ├── 11/
│       │   └── 12/
│       └── 2026/
│           └── 01/
├── schemas/
│   ├── analytics.ts
│   ├── auth.ts
│   ├── bulk-service.ts
│   ├── complaint.ts
│   ├── contract-attachment.ts
│   ├── contract-reminder.ts
│   ├── contract.ts
│   ├── humanitarian-org.ts
│   ├── humanitarian-renewal.ts
│   ├── index.ts
│   ├── notification.ts
│   ├── operator.ts
│   ├── parking-service.ts
│   ├── product.ts
│   ├── provider.ts
│   ├── security.ts
│   └── service.ts
├── scripts/
│   ├── data/
│   ├── email/
│   │   ├── Re_ [#4327557-TicketID] 1-153049022467_ 381641342298.eml
│   │   └── RE_ Re_ Re_ Fwd_ [#4299959-TicketID] Fwd_ prigovor 1-152201056690 na MTS.eml
│   ├── errors/
│   ├── errors-vas-services/
│   ├── input/
│   ├── input-vas-services/
│   ├── processed/
│   ├── processed-vas-services/
│   ├── vas-import/
│   │   ├── processors/
│   │   │   ├── ExcelProcessor.tsx
│   │   │   └── PostpaidExcelProcessor.ts
│   │   ├── utils/
│   │   │   └── ParkingImportUtils.ts
│   │   ├── getOrCreateContract11.tsx
│   │   ├── ParkingServiceProcessor.tsx
│   │   ├── PostpaidServiceProcessor.ts
│   │   └── VasImportService.tsx
│   ├── email_processor.py
│   ├── eml_parse.py
│   ├── generate-tree.js
│   ├── msg_parse.py
│   ├── parking_service_processor.py
│   ├── parsemail.py
│   ├── python-eml.py
│   └── vas_provider_processor.py
├── templates/
├── types/
│   ├── parking-reports.ts
│   └── theme.ts
├── utils/
│   ├── anomaly-detection.ts
│   ├── complaint-notification.ts
│   ├── complaint-statistics.ts
│   ├── complaint-status.ts
│   ├── csv-validator.ts
│   ├── date-filters.ts
│   ├── excel-generator.ts
│   ├── format.ts
│   ├── import-processor.ts
│   ├── parking-reports-helper.ts
│   ├── report-path.ts
│   └── theme-script.ts
├── .gitignore
├── auth-extensions.d.ts
├── auth-types.d.ts
├── auth.config.ts
├── auth.ts
├── BUILD_ERRORS_REPORT.md
├── build-errors.txt
├── components.json
├── empty-module.js
├── favicon-dark.png
├── favicon-light.png
├── favicon.ico
├── help.html
├── lista-nv.txt
├── lista-nv45.txt
├── lista.txt
├── lista11.txt
├── log.txt
├── logsas.txt
├── next-env.d.ts
├── next.config.mjs
├── package-lock.json
├── package.json
├── page-structure.txt
├── pages-list.txt
├── postcss.config.mjs
├── project-structure.md
├── promenesvenovo.md
├── proxy.ts
├── README.md
├── routes.ts
├── setup.bat
├── structure.txt
├── tailwind.config.ts
├── tree-config.json
├── tsconfig.json
├── tsconfig.tsbuildinfo
└── typedoc.json
```

## Summary

- **Total Directories**: 1175
- **Total Files**: 741
- **Ignored Directories**: 9
- **Ignored Files**: 961

### Files by Extension
- **.xls**: 920
- **.ts**: 350
- **.tsx**: 302
- **.md**: 22
- **.xlsx**: 18
- **.json**: 14
- **.txt**: 11
- **.csv**: 10
- **no-extension**: 9
- **.sql**: 7
- **.py**: 7
- **.png**: 6
- **.eml**: 3
- **.log**: 2
- **.js**: 2
- **.mjs**: 2
- **.msg**: 2
- **.css**: 2
- **.woff**: 2
- **.yml**: 2
- **.prisma**: 2
- **.ico**: 1
- **.html**: 1
- **.bat**: 1
- **.vbs**: 1
- **.tsbuildinfo**: 1
- **.mdx**: 1
- **.toml**: 1

### Ignored Patterns
- **Directories**: node_modules, .next, .git, dist, build, .turbo, coverage, venv, __pycache__
- **File Extensions**: .xlsx, .xls, .pdf, .zip, .csv, .msg, .vbs, .pyc, .log
