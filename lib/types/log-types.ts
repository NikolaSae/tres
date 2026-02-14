// lib/types/log-types.ts

import { LogActionType, LogStatus } from "@prisma/client";

// Define the log entry item type
export interface LogEntryItem {
  id: string;
  action: LogActionType;
  subject: string;
  description?: string | null;
  status: LogStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy: {
    id: string;
    name?: string | null;
  };
  updatedBy?: {
    id: string;
    name?: string | null;
  } | null;
  sendEmail: boolean;
  provider: {
    id: string;
    name: string;
  } | null;
}

// Filter state type
export interface LogFiltersState {
  action?: LogActionType | 'ALL';
  status?: LogStatus | 'ALL';
  subjectKeyword?: string;
  dateFrom?: Date;
  dateTo?: Date;
}