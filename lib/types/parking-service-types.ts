// lib/types/parking-service-types.ts

// Types for Parking Services
import { ParkingService as PrismaParkingService } from "@prisma/client";

// Base Parking Service type from Prisma schema
export type ParkingServiceType = PrismaParkingService;

// Base interface for parking service data
export interface ParkingServiceFormData {
  id?: string;
  name: string;
  description?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  additionalEmails?: string[];
  isActive: boolean;
}

// Type for creating a new parking service
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

// Type for updating an existing parking service
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

// ✅ FIX: Type for filtering parking services
export interface ParkingServiceFilters {
  searchTerm?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'lastImportDate';
  sortDirection?: 'asc' | 'desc';
  page: number;
  pageSize: number;
  hasImportedFiles?: boolean;
}

// ✅ Type for getParkingServices params
export interface GetParkingServicesParams {
  searchTerm?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'lastImportDate';
  sortDirection?: 'asc' | 'desc';
  page: number; // Required
  pageSize: number; // Required
  hasImportedFiles?: boolean;
}

// Type for parking service with associated contracts
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

// ✅ FIX: Extended parking service for list view with optional import-related fields
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
  createdById?: string | null; // ✅ Made optional
  fileSize?: number | null; // ✅ Made optional
  originalFileName?: string | null; // ✅ Made optional
  originalFilePath?: string | null; // ✅ Made optional
  mimeType?: string | null; // ✅ Made optional
  lastImportDate?: Date | null; // ✅ Made optional
  importedBy?: string | null; // ✅ Made optional
  importStatus?: string | null; // ✅ Made optional
  reportSendHistory?: any[]; // ✅ Made optional
  services?: {
    id: string;
    name: string;
  }[];
}

// ✅ Type for paginated parking services response
export interface PaginatedParkingServices {
  parkingServices: ParkingServiceWithRelations[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Complete parking service interface with all database fields
export interface ParkingService extends PrismaParkingService {
  additionalEmails: string[];
}

// API response types
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

// Type for file upload tracking
export interface FileUploadInfo {
  originalFileName: string;
  originalFilePath: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: Date;
}

// Type for import status update
export interface ImportStatusUpdate {
  parkingServiceId: string;
  importStatus: 'success' | 'failed' | 'in_progress';
  lastImportDate: Date;
  importedBy: string;
  errorMessage?: string;
}

// Query parameters for filtering parking services
export interface ParkingServiceQueryParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}