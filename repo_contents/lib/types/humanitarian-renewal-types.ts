// /lib/types/humanitarian-renewal-types.ts
import { Prisma } from "@prisma/client";

// Osnovni tip obnove sa uključenim relacijama
export type HumanitarianRenewalWithRelations = Prisma.HumanitarianContractRenewalGetPayload<{
  include: {
    contract: {
      include: {
        humanitarianOrg: true;
      };
    };
    humanitarianOrg: true;
    createdBy: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
    lastModifiedBy: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
  };
}>;

// Tip za listu obnova
export type HumanitarianRenewalsList = {
  renewals: HumanitarianRenewalWithRelations[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

// Tip za dashboard statistike
export type RenewalStatistics = {
  totalRenewals: number;
  inProgress: number;
  awaitingSignature: number;
  completed: number;
  averageProgress: number;
  renewalsByStatus: {
    status: string;
    count: number;
    label: string;
  }[];
  monthlyRenewals: {
    month: string;
    count: number;
  }[];
};

// Tip za dostupne ugovore za obnovu
export type AvailableContractForRenewal = {
  id: string;
  name: string;
  contractNumber: string;
  endDate: Date;
  humanitarianOrg: {
    id: string;
    name: string;
    contactName: string | null;
    email: string | null;
  };
  hasActiveRenewal: boolean;
};

// Tip za progress tracking
export type RenewalProgress = {
  documentsReceived: boolean;
  legalApproved: boolean;
  financialApproved: boolean;
  signatureReceived: boolean;
  percentage: number;
  currentStep: string;
  nextStep: string | null;
};

// Enum za status konfiguraciju
export const RENEWAL_STATUS_CONFIG = {
  DOCUMENT_COLLECTION: {
    label: 'Prikupljanje dokumenata',
    color: 'bg-orange-100 text-orange-800',
    description: 'Čeka se dostavljanje potrebnih dokumenata',
    nextActions: ['Kontaktirati organizaciju', 'Poslati podsetnik']
  },
  LEGAL_REVIEW: {
    label: 'Pravni pregled',
    color: 'bg-blue-100 text-blue-800',
    description: 'Dokumenti su u pravnom pregledu',
    nextActions: ['Čekati mišljenje pravnika', 'Priložiti dodatne dokumente']
  },
  FINANCIAL_APPROVAL: {
    label: 'Finansijska potvrda',
    color: 'bg-purple-100 text-purple-800',
    description: 'Čeka finansijsku potvrdu',
    nextActions: ['Odobriti budžet', 'Zatražiti izmene']
  },
  AWAITING_SIGNATURE: {
    label: 'Čeka potpis',
    color: 'bg-yellow-100 text-yellow-800',
    description: 'Spreman za potpis',
    nextActions: ['Poslati ugovor na potpis', 'Zakazati sastanak']
  },
  FINAL_PROCESSING: {
    label: 'Završno procesiranje',
    color: 'bg-green-100 text-green-800',
    description: 'Završava se proces obnove',
    nextActions: ['Aktivirati novi ugovor', 'Arhivirati stari ugovor']
  }
} as const;

// Tip za history tracking
export type RenewalStatusHistory = {
  id: string;
  renewalId: string;
  previousStatus: string | null;
  newStatus: string;
  changedAt: Date;
  changedBy: {
    id: string;
    name: string;
  };
  notes: string | null;
};

// Tip za notifikacije vezane za obnove
export type RenewalNotification = {
  id: string;
  renewalId: string;
  type: 'REMINDER' | 'STATUS_CHANGE' | 'DEADLINE_APPROACHING' | 'DOCUMENT_REQUIRED';
  message: string;
  isRead: boolean;
  createdAt: Date;
  renewal: {
    id: string;
    contract: {
      contractNumber: string;
      name: string;
    };
    humanitarianOrg: {
      name: string;
    };
  };
};

// Tip za exportovanje podataka
export type RenewalExportData = {
  contractNumber: string;
  contractName: string;
  organizationName: string;
  currentStatus: string;
  proposedStartDate: string;
  proposedEndDate: string;
  proposedRevenue: number;
  documentsReceived: boolean;
  legalApproved: boolean;
  financialApproved: boolean;
  signatureReceived: boolean;
  progress: number;
  renewalStartDate: string;
  lastModified: string;
  createdBy: string;
  notes: string;
};