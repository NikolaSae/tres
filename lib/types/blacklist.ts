// lib/types/blacklist.ts
import { SenderBlacklist, Provider, User } from '@prisma/client';

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
  modifiedBy?: { // ✅ Added for completeness
    id: string;
    name?: string | null;
  } | null;
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

// ✅ FIX: Add createdBy and modifiedBy relations
export type SenderBlacklistWithProvider = SenderBlacklist & {
  provider: Provider | null;
  createdBy: {
    id: string;
    name: string | null;
    email: string;
  };
  modifiedBy?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
};

// ✅ ALTERNATIVE: Use Prisma's Payload type for better type safety
export type SenderBlacklistWithRelations = SenderBlacklist & {
  createdBy: Pick<User, 'id' | 'name' | 'email'>;
  modifiedBy?: Pick<User, 'id' | 'name' | 'email'> | null;
  provider?: Provider | null;
};