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
  additionalEmails?: string[]; // Novo polje za dodatne email adrese
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
  // New file tracking fields
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
  // New file tracking fields
  originalFileName?: string;
  originalFilePath?: string;
  fileSize?: number;
  mimeType?: string;
  lastImportDate?: Date;
  importedBy?: string;
  importStatus?: 'success' | 'failed' | 'in_progress';
}

// Type for filtering parking services
export interface ParkingServiceFilters {
  searchTerm?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'lastImportDate';
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  hasImportedFiles?: boolean; // Filter by services with imported files
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

// Type for paginated parking services response
export interface PaginatedParkingServices {
  parkingServices: ParkingServiceType[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Complete parking service interface with all database fields
// Extended from Prisma type to include additional fields
export interface ParkingService extends PrismaParkingService {
  additionalEmails: string[]; // Dodatno polje koje možda nije u Prisma modelu
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