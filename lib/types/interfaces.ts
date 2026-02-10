// /lib/types/interfaces.ts:

import { ComplaintStatus, ServiceType, UserRole } from "@prisma/client";

export interface ComplaintBase {
  title: string;
  description: string;
  status: ComplaintStatus;
  priority: number;
  financialImpact?: number;
  serviceId?: string;
  productId?: string;
  providerId?: string;
  humanitarianOrgId?: string;
  parkingServiceId?: string;
}

export interface Complaint extends ComplaintBase {
  id: string;
  submittedById: string;
  submittedBy: User;
  assignedAgentId?: string;
  assignedAgent?: User;
  assignedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  service?: Service;
  product?: Product;
  provider?: Provider;
  humanitarianOrg?: HumanitarianOrg;
  parkingService?: ParkingService;
  comments: Comment[];
  attachments: Attachment[];
  statusHistory: ComplaintStatusHistory[];
}

export interface ComplaintStatusHistory {
  id: string;
  complaintId: string;
  previousStatus?: ComplaintStatus;
  newStatus: ComplaintStatus;
  changedById: string;
  changedAt: Date;
  notes?: string;
}

export interface Comment {
  id: string;
  text: string;
  complaintId: string;
  userId: string;
  user: User;
  createdAt: Date;
  updatedAt: Date;
  isInternal: boolean;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  complaintId: string;
  uploadedAt: Date;
}

export interface User {
  id: string;
  name?: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Service {
  id: string;
  name: string;
  type: ServiceType;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Provider {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface HumanitarianOrg {
  id: string;
  name: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  address?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ParkingService {
  id: string;
  name: string;
  location?: string;
  address?: string;
  capacity?: number;
  availableSpots?: number;
  pricePerHour?: number;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplaintFilterOptions {
  status?: ComplaintStatus;
  priority?: number;
  serviceId?: string;
  productId?: string;
  providerId?: string;
  assignedAgentId?: string;
  submittedById?: string;
  humanitarianOrgId?: string;
  parkingServiceId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface ComplaintStatistics {
  totalComplaints: number;
  newComplaints: number;
  resolvedComplaints: number;
  averageResolutionTime: number; // in days
  byStatus: Record<ComplaintStatus, number>;
  byService: Array<{ serviceId: string, serviceName: string, count: number }>;
  byProvider: Array<{ providerId: string, providerName: string, count: number }>;
  byPriority: Record<number, number>;
  byHumanitarianOrg?: Array<{ orgId: string, orgName: string, count: number }>;
  byParkingService?: Array<{ serviceId: string, serviceName: string, count: number }>;
  timelineData: Array<{ date: string, count: number }>;
}