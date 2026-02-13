// /lib/types/humanitarian-org-types.ts
export interface HumanitarianOrg {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  contactName: string | null;
  address: string | null;
  website: string | null;
  mission: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  pib: string | null;
  registrationNumber: string | null;
  bank: string | null;
  accountNumber: string | null;
  shortNumber: string | null;
}

export interface HumanitarianOrgWithDetails extends HumanitarianOrg {
  _count?: {
    contracts: number;
    complaints: number;
    renewals: number;
  }
}

export interface HumanitarianOrgFilterOptions {
  search?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortDirection?: 'asc' | 'desc';
}

export interface HumanitarianOrgsResult {
  data: HumanitarianOrgWithDetails[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}