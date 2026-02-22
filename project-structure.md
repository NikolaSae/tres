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
├
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
