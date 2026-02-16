// lib/types/parking-service-types.ts
import { ParkingService as PrismaParkingService } from "@prisma/client";

export type ParkingServiceType = PrismaParkingService;

export interface ParkingServiceItem {
  id: string;
  name: string;
  description: string | null;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ParkingServiceDetail {
  id: string;
  name: string;
  description: string | null;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  additionalEmails: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdById?: string | null;
  fileSize?: number | null;
  originalFileName?: string | null;
  originalFilePath?: string | null;
  mimeType?: string | null;
  lastImportDate?: Date | null;
  importedBy?: string | null;
  importStatus?: string | null;
}

export interface ParkingServiceFormData {
  name: string;
  description?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  additionalEmails: string[];
  isActive: boolean;
  id?: string;
}

export interface CreateParkingServiceParams {
  name: string;
  description?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  additionalEmails?: string[];
  isActive?: boolean;
  originalFileName?: string;
  originalFilePath?: string;
  fileSize?: number;
  mimeType?: string;
  lastImportDate?: Date;
  importedBy?: string;
  importStatus?: 'success' | 'failed' | 'in_progress';
}

export interface UpdateParkingServiceParams {
  id: string;
  name?: string;
  description?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  additionalEmails?: string[];
  isActive?: boolean;
  originalFileName?: string;
  originalFilePath?: string;
  fileSize?: number;
  mimeType?: string;
  lastImportDate?: Date;
  importedBy?: string;
  importStatus?: 'success' | 'failed' | 'in_progress';
}

export interface ParkingServiceFilters {
  searchTerm?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'lastImportDate';
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  hasImportedFiles?: boolean;
  serviceNumber?: string;
  hasContracts?: boolean;
}

export interface GetParkingServicesParams {
  searchTerm?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'lastImportDate';
  sortDirection?: 'asc' | 'desc';
  page: number;
  pageSize: number;
  hasImportedFiles?: boolean;
}

export interface ParkingServiceWithContracts extends ParkingServiceType {
  contracts: {
    id: string;
    name: string;
    contractNumber: string;
    status: string;
    startDate: Date;
    endDate: Date;
  }[];
}

export interface ParkingServiceWithRelations {
  id: string;
  name: string;
  description: string | null;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  additionalEmails: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdById?: string | null;
  fileSize?: number | null;
  originalFileName?: string | null;
  originalFilePath?: string | null;
  mimeType?: string | null;
  lastImportDate?: Date | null;
  importedBy?: string | null;
  importStatus?: string | null;
  reportSendHistory?: any[];
  services?: {
    id: string;
    name: string;
  }[];
}

export interface PaginatedParkingServices {
  parkingServices: ParkingServiceWithRelations[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ParkingService extends PrismaParkingService {
  additionalEmails: string[];
}

export interface ParkingServiceActionResult {
  success: boolean;
  data?: ParkingService;
  error?: string;
}

export interface ParkingServicesListResult {
  success: boolean;
  data?: ParkingService[];
  error?: string;
}

export interface FileUploadInfo {
  originalFileName: string;
  originalFilePath: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface ImportStatusUpdate {
  parkingServiceId: string;
  importStatus: 'success' | 'failed' | 'in_progress';
  lastImportDate: Date;
  importedBy: string;
  errorMessage?: string;
}

export interface ParkingServiceQueryParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}