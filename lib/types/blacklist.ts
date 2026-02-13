// lib/types/blacklist.ts
import { SenderBlacklist, Provider } from '@prisma/client';

export interface SenderBlacklistEntry {
  id: string;
  senderName: string;
  effectiveDate: Date;
  description?: string | null;
  isActive: boolean;
  matchCount: number;
  lastMatchDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: {
    id: string;
    name?: string | null;
  };
}

export interface CreateBlacklistEntryRequest {
  senderName: string;
  effectiveDate: Date;
  description?: string;
  isActive?: boolean;
}

export interface CreateBlacklistEntryResponse {
  success: boolean;
  data?: SenderBlacklistEntry[];
  error?: string;
  message?: string;
}

// Za match-ove
export interface BlacklistMatch {
  blacklistEntry: SenderBlacklistEntry;
  matchingServices: any[];
}

// Dodaj ovaj tip koji hook očekuje
export type SenderBlacklistWithProvider = SenderBlacklist & {
  provider: Provider | null;
};