# Project API Documentation

## Overview
This document describes all API routes for the management dashboard, organized by module.  
It includes usage, purpose, and key endpoints.

---

## Admin
- **MCP (Management Control Panel)**
  - `/api/admin/mcp/logs` – fetch system logs
  - `/api/admin/mcp/my-logs` – fetch logs for current user
  - `/api/admin/mcp/refresh` – refresh MCP data
  - `/api/admin/mcp/search-humanitarian-orgs` – search humanitarian organizations
  - `/api/admin/mcp/stats` – fetch MCP statistics
  - `/api/admin/mcp/system-health` – check system health
  - `/api/admin/mcp/tools-usage` – tool usage tracking
  - `/api/admin/mcp/users` – list MCP users
  - `/api/admin/mcp/users/[userId]/logs` – logs of a specific user

## Analytics
- `/api/analytics/financials` – financial reports
- `/api/analytics/sales` – sales reports

## Auth
- `/api/auth/[...nextauth]` – NextAuth authentication routes

## Blacklist
- `/api/blacklist` – manage blacklisted users or organizations

## Bulk Services
- `/api/bulk-services` – list bulk services
- `/api/bulk-services/[id]` – get details of a bulk service
- `/api/bulk-services/import` – import bulk services
- `/api/bulk-services/export` – export bulk services

## Chat
- `/api/chat/database` – full database chat operations
- `/api/chat/database-simple` – simple database chat
- `/api/chat` – generic chat endpoints

## Complaints
- `/api/complaints` – list complaints
- `/api/complaints/[id]` – complaint details
  - `/attachments` – upload or fetch attachments
  - `/comments` – manage comments
  - `/status` – update or check status
- `/api/complaints/export` – export complaints
- `/api/complaints/statistics` – fetch complaint stats

## Contracts
- `/api/contracts` – list contracts
- `/api/contracts/[id]` – contract details
  - `/attachments` – contract attachments
  - `/edit` – edit contract
  - `/reminders` – contract reminders
  - `/renewal` – contract renewal
    - `/attachments` – renewal attachments
    - `/status` – renewal status
  - `/services` – associated services
  - `/status` – current contract status
- `/api/contracts/expiring` – expiring contracts
- `/api/contracts/export` – export contracts
- `/api/contracts/statistics/expiry` – expiry statistics
- `/api/contracts/timeline/expiry` – contract timeline for expiring

## Cron Jobs
- `/api/cron/check-expiring` – check contracts expiring soon

## Humanitarian Orgs
- `/api/humanitarian-orgs` – list all organizations
- `/api/humanitarian-orgs/[id]` – organization details
  - `/contracts` – organization contracts
  - `/services` – organization services

## Humanitarian Renewals
- `/api/humanitarian-renewals` – list renewals
- `/api/humanitarian-renewals/[id]` – renewal details
- `/api/humanitarian-renewals/statistics` – renewal stats

## Notifications
- `/api/notifications` – list and manage notifications
- `/api/notifications/email` – email notifications
- `/api/notifications/push` – push notifications

## Operators
- `/api/operators` – list operators
- `/api/operators/[id]` – operator details
  - `/contracts` – operator contracts
- `/api/operators/contracts` – all contracts per operator

## Organizations
- `/api/organizations/by-kratki-broj/[kratkiBroj]` – fetch org by short number

## Parking Services
- `/api/parking-services` – list parking services
- `/api/parking-services/[id]` – parking service details
  - `/contracts` – associated contracts
  - `/reports` – parking reports
  - `/services` – services linked to parking
- `/api/parking-services/parking-import` – import parking data
- `/api/parking-services/rename-file` – rename uploaded files
- `/api/parking-services/typescript-import` – TypeScript import
- `/api/parking-services/typescript-import-stream` – TypeScript streaming import
- `/api/parking-services/upload` – upload files

## Products
- `/api/products` – list products
- `/api/products/[id]` – product details

## Providers
- `/api/providers` – list providers
- `/api/providers/[id]` – provider details
  - `/bulk-services` – provider bulk services
  - `/contracts` – provider contracts
  - `/edit` – edit provider
  - `/renwe-contract` – renew contract
  - `/status` – provider status
  - `/vas-services` – VAS services
- `/api/providers/by-name/[name]` – search provider by name
- `/api/providers/upload` – upload providers
- `/api/providers/vas-import` – import VAS services

## Reports
- `/api/reports/generate` – generate reports
- `/api/reports/scan-unified` – scan unified system
- `/api/reports/upload-humanitarian` – upload humanitarian reports
- `/api/reports/upload-parking` – upload parking reports
- `/api/reports/upload-provider` – upload provider reports
- `/api/reports/validate-system` – system validation

## Security
- `/api/security/logs` – view logs
- `/api/security/performance` – performance metrics
  - `/summary` – summary performance
- `/api/security/permissions` – manage permissions

## Sender Blacklist
- `/api/sender-blacklist` – manage sender blacklist

## Services
- `/api/services` – list all services
- `/api/services/[id]` – service details
- `/api/services/bulk/[bulkId]` – bulk service details
- `/api/services/categories` – list service categories
- `/api/services/humanitarian/[orgId]` – humanitarian services per org
- `/api/services/parking/[parkingId]` – parking service details
- `/api/services/import` – import services

## Test
- `/api/test` – test endpoints

## Users
- `/api/users` – list users
- `/api/users/[id]` – user details

## VAS Services
- `/api/vas-services/upload` – upload VAS services
- `/api/vas-services/postpaid-import-stream` – import postpaid VAS data
