// lib/types/operator-types.ts


import { Operator } from "@prisma/client";

// Base Operator type from Prisma
export type OperatorType = Operator;

// Extended Operator type with related data
export interface OperatorWithRelations extends Operator {
  contracts?: {
    id: string;
    name: string;
    contractNumber: string;
    startDate: Date;
    endDate: Date;
    revenuePercentage: number;
    operatorRevenue: number | null;
  }[];
  _count?: {
    contracts: number;
  };
}

// Type for operator list item with minimal data
export interface OperatorListItem {
  id: string;
  name: string;
  code: string;
  contactEmail: string | null;
  contactPhone: string | null;
  active: boolean;
  contractCount: number;
}

// Type for operator creation/update API payload
export interface OperatorPayload {
  name: string;
  code: string;
  description?: string | null;
  logoUrl?: string | null;
  website?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  active: boolean;
}

// Type for operator filters
export interface OperatorFilters {
  search?: string;
  active?: "all" | "active" | "inactive";
  sortBy?: "name" | "code" | "createdAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

// Type for operator list response
export interface OperatorListResponse {
  operators: OperatorListItem[];
  totalCount: number;
  pageCount: number;
  currentPage: number;
}