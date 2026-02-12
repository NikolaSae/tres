// lib/types/complaint-types.ts

import { Prisma, ComplaintStatus, ServiceType } from "@prisma/client";
import { ComplaintPriority, ServiceCategoryType } from "./enums";

// Use Prisma's generated type with proper includes - this matches what the API returns
export type ComplaintWithRelations = Prisma.ComplaintGetPayload<{
  include: {
    submittedBy: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
    assignedAgent: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
    service: {
      select: {
        id: true;
        name: true;
        type: true;
      };
    };
    product: {
      select: {
        id: true;
        name: true;
        code: true;
      };
    };
    provider: {
      select: {
        id: true;
        name: true;
      };
    };
    humanitarianOrg: {
      select: {
        id: true;
        name: true;
      };
    };
    parkingService: true;
  };
}>;

// Alternative: If you need a more flexible type that works with partial includes
export type ComplaintWithPartialRelations = Prisma.ComplaintGetPayload<{
  include: {
    submittedBy: true;
    assignedAgent: true;
    service: true;
    product: true;
    provider: true;
    humanitarianOrg: true;
    parkingService: true;
  };
}>;

export type ComplaintSummary = {
  id: string;
  title: string;
  status: ComplaintStatus;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
  submittedByName: string;
  assignedAgentName?: string | null;
  serviceName?: string | null;
  productName?: string | null;
  providerName?: string | null;
  humanitarianOrgName?: string | null;
  parkingServiceName?: string | null;
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
    humanitarianOrgId?: string[];
    parkingServiceId?: string[];
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
  humanitarianOrgName?: string;
  parkingServiceName?: string;
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