// /lib/types/enums.ts:

import { ComplaintStatus, ServiceType } from "@prisma/client";

export enum ComplaintPriority {
  CRITICAL = 1,
  HIGH = 2,
  MEDIUM = 3,
  LOW = 4,
  TRIVIAL = 5
}

export enum ComplaintSortField {
  CREATED_AT = "createdAt",
  UPDATED_AT = "updatedAt",
  PRIORITY = "priority",
  STATUS = "status"
}

export enum SortDirection {
  ASC = "asc",
  DESC = "desc"
}

export enum FileType {
  IMAGE = "image",
  DOCUMENT = "document",
  SPREADSHEET = "spreadsheet",
  PDF = "pdf",
  OTHER = "other"
}

export enum ReportType {
  COMPLAINT_SUMMARY = "complaint_summary",
  RESOLUTION_TIME = "resolution_time",
  PROVIDER_PERFORMANCE = "provider_performance",
  SERVICE_ISSUES = "service_issues",
  PRODUCT_ISSUES = "product_issues",
  AGENT_PERFORMANCE = "agent_performance"
}

// Re-export from prisma for easier imports
export { ComplaintStatus, ServiceType };

export enum ExportFormat {
  CSV = "csv",
  EXCEL = "excel",
  PDF = "pdf",
  JSON = "json"
}

export enum ServiceCategoryType {
  MESSAGING = "messaging",
  PAYMENT = "payment",
  VOICE = "voice",
  DATA = "data",
  CONTENT = "content",
  OTHER = "other"
}

export enum NotificationType {
  COMPLAINT_CREATED = "complaint_created",
  COMPLAINT_ASSIGNED = "complaint_assigned",
  COMPLAINT_UPDATED = "complaint_updated",
  COMPLAINT_RESOLVED = "complaint_resolved",
  COMMENT_ADDED = "comment_added"
}