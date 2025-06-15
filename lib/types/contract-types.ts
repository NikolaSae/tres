// /lib/types/contract-types.ts
import { ContractStatus, ContractType, ContractRenewalSubStatus, Service } from '@prisma/client';
import { z } from 'zod';
import { contractSchema } from '@/schemas/contract';

export type ContractFormData = z.infer<typeof contractSchema>;

// Re-export Prisma types for easier importing
export { ContractStatus, ContractType, ContractRenewalSubStatus };

export interface SelectedService {
  serviceId: string;
  specificTerms?: string;
}

export interface Contract {
  id: string;
  name: string;
  contractNumber: string;
  type: ContractType;
  status: ContractStatus;
  startDate: Date;
  endDate: Date;
  revenuePercentage: number;
  description: string | null;
  providerId: string | null;
  humanitarianOrgId: string | null;
  parkingServiceId: string | null;
  services?: (Service & { specificTerms?: string })[];
  renewals?: ContractRenewal[];
  provider?: { name: string };
  humanitarianOrg?: { name: string };
  parkingService?: { name: string };
  createdAt: Date;
  updatedAt: Date;
}

export interface ContractRenewal {
  id: string;
  contractId: string;
  subStatus: ContractRenewalSubStatus;
  proposedStartDate: string;
  proposedEndDate: string;
  proposedRevenue?: number;
  comments?: string;
  internalNotes?: string;
  documentsReceived: boolean;
  legalApproved: boolean;
  financialApproved: boolean;
  technicalApproved: boolean;
  managementApproved: boolean;
  signatureReceived: boolean;
  createdAt: string;
  updatedAt: string;
  attachments?: ContractRenewalAttachment[];
}

export interface ContractRenewalAttachment {
  id: string;
  renewalId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  filePath: string;
  description?: string;
  uploadedAt: string;
  uploadedBy: {
    name: string;
    email: string;
  };
}

export interface ServiceWithTerms extends Service {
  specificTerms?: string;
}

export interface FilterOptions {
  type?: ContractType | null;
  status?: ContractStatus | null;
  providerId?: string | null;
  humanitarianOrgId?: string | null;
  parkingServiceId?: string | null;
  search?: string | null;
  expiringWithin?: number | null;
  limit?: number;
}