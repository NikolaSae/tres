// /lib/types/complaint-types.ts:

import { ComplaintStatus, ServiceType } from "@prisma/client";
import { ComplaintPriority, ServiceCategoryType } from "./enums";
import { Complaint, User, Service, Product, Provider } from "./interfaces";

export type ComplaintWithRelations = Complaint & {
  submittedBy: User;
  assignedAgent?: User;
  service?: Service;
  product?: Product;
  provider?: Provider;
};

export type ComplaintSummary = {
  id: string;
  title: string;
  status: ComplaintStatus;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
  submittedByName: string;
  assignedAgentName?: string;
  serviceName?: string;
  productName?: string;
  providerName?: string;
};

export type ComplaintStatusUpdate = {
  complaintId: string;
  status: ComplaintStatus;
  notes?: string;
};

export type ComplaintAssignment = {
  complaintId: string;
  agentId: string;
};

export type ComplaintComment = {
  complaintId: string;
  text: string;
  isInternal: boolean;
};

export type ComplaintAttachment = {
  complaintId: string;
  file: File;
};

export type ComplaintExportOptions = {
  format: "csv" | "excel" | "pdf";
  filters?: {
    status?: ComplaintStatus[];
    dateRange?: {
      from: Date;
      to: Date;
    };
    priority?: ComplaintPriority[];
    serviceId?: string[];
    providerId?: string[];
  };
  includeComments: boolean;
  includeAttachments: boolean;
  includeHistory: boolean;
};

export type ComplaintImportData = {
  title: string;
  description: string;
  priority: number;
  serviceName?: string;
  productName?: string;
  providerName?: string;
  submittedByEmail: string;
  assignedAgentEmail?: string;
};

export type ComplaintsByService = {
  serviceId: string;
  serviceName: string;
  category: ServiceCategoryType;
  count: number;
  resolvedCount: number;
  openCount: number;
  averageResolutionTime: number; // in days
};

export type ComplaintsByProvider = {
  providerId: string;
  providerName: string;
  count: number;
  resolvedCount: number;
  openCount: number;
  averageResolutionTime: number; // in days
};

export type ComplaintTimelineItem = {
  date: string;
  count: number;
  byStatus: Record<ComplaintStatus, number>;
};

export type AgentPerformance = {
  agentId: string;
  agentName: string;
  assignedCount: number;
  resolvedCount: number;
  averageResolutionTime: number; // in days
  byStatus: Record<ComplaintStatus, number>;
};

export type ComplaintActivityLog = {
  id: string;
  complaintId: string;
  timestamp: Date;
  userId: string;
  userName: string;
  action: "created" | "updated" | "status_changed" | "assigned" | "comment_added" | "attachment_added";
  details: string;
};