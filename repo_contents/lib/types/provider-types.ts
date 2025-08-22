// /lib/types/provider-types.ts
import { Provider } from "@prisma/client";

// Основни типи
export interface ProviderBase extends Provider {
  // Поље 'services' није потребно јер се већ налази у Prisma типу
}

// Проширени тип са бројачима релација
export interface ProviderWithCounts extends Provider {
  _count?: {
    contracts: number;
    vasServices: number;
    bulkServices: number;
    complaints: number;
  };
}

// Опције за филтрирање и сортирање
export interface ProviderFilterOptions {
  search?: string;
  isActive?: boolean;
  hasContracts?: boolean;
  hasComplaints?: boolean;
  sortBy?: 'name' | 'createdAt';
  sortDirection?: 'asc' | 'desc';
}

// Опције за пагинацију
export interface PaginationOptions {
  page: number;
  limit: number;
}

// Резултат API позива
export interface ProvidersResult {
  data: ProviderWithCounts[];
  total: number;
  page: number;
  limit: number;
  error?: string | null;
}