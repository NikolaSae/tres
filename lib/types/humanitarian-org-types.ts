// /lib/types/humanitarian-org-types.ts

// Osnovni tip za humanitarnu organizaciju
export interface HumanitarianOrg {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  contactPerson: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Prošireni tip sa brojem povezanih entiteta
export interface HumanitarianOrgWithDetails extends HumanitarianOrg {
  _count?: {
    contracts: number;
    complaints: number;
    services?: number;
  }
}

// Tip za filtere
export interface HumanitarianOrgFilterOptions {
  search?: string;
  isActive?: boolean;
  country?: string;
  city?: string;
  hasContracts?: boolean;
  hasComplaints?: boolean;
  sortBy?: 'name' | 'createdAt' | 'contractsCount' | 'complaintsCount';
  sortDirection?: 'asc' | 'desc';
}

// Tip za rezultat API poziva
export interface HumanitarianOrgsResult {
  data: HumanitarianOrgWithDetails[];
  total: number;
  page: number;
  limit: number;
}