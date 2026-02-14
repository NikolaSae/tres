// lib/types/complaint-types.ts

import { Prisma, ComplaintStatus, ServiceType } from "@prisma/client";
import { ComplaintPriority, ServiceCategoryType } from "./enums";

// ✅ Osnovni tip sa standardnim relacijama
export type ComplaintWithRelations = Prisma.ComplaintGetPayload<{
  include: {
    submittedBy: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
    assignedAgent: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
    service: {
      select: {
        id: true;
        name: true;
        type: true;
      };
    };
    product: {
      select: {
        id: true;
        name: true;
        code: true;
      };
    };
    provider: {
      select: {
        id: true;
        name: true;
      };
    };
    humanitarianOrg: {
      select: {
        id: true;
        name: true;
      };
    };
    parkingService: true;
  };
}>;

// ✅ NOVI TIP: Sa komentarima, prilozima i istorijom statusa
export type ComplaintWithAllRelations = Prisma.ComplaintGetPayload<{
  include: {
    submittedBy: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
    assignedAgent: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
    service: {
      select: {
        id: true;
        name: true;
        type: true;
      };
    };
    product: {
      select: {
        id: true;
        name: true;
        code: true;
      };
    };
    provider: {
      select: {
        id: true;
        name: true;
      };
    };
    humanitarianOrg: {
      select: {
        id: true;
        name: true;
      };
    };
    parkingService: true;
    // ✅ Dodato: Comments sa user podacima
    comments: {
      include: {
        user: {
          select: {
            id: true;
            name: true;
            email: true;
          };
        };
      };
    };
    // ✅ Dodato: Attachments
    attachments: true;
    // ✅ Dodato: Status history (ime u šemi je ComplaintStatusHistory)
    statusHistory: true;
  };
}>;

// Alternativa: Ako vam treba i changedBy informacija u status history
export type ComplaintWithFullHistory = Prisma.ComplaintGetPayload<{
  include: {
    submittedBy: { select: { id: true; name: true; email: true } };
    assignedAgent: { select: { id: true; name: true; email: true } };
    service: { select: { id: true; name: true; type: true } };
    product: { select: { id: true; name: true; code: true } };
    provider: { select: { id: true; name: true } };
    humanitarianOrg: { select: { id: true; name: true } };
    parkingService: true;
    comments: {
      include: {
        user: {
          select: { id: true; name: true; email: true };
        };
      };
    };
    attachments: true;
    statusHistory: {
      select: {
        id: true;
        complaintId: true;
        status: true;
        changedAt: true;
        changedBy: {
          select: { id: true; name: true; email: true };
        };
      };
    };
  };
}>;

// ... ostali tipovi ostaju isti
export type ComplaintSummary = {
  id: string;
  title: string;
  status: ComplaintStatus;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
  submittedByName: string;
  assignedAgentName?: string | null;
  serviceName?: string | null;
  productName?: string | null;
  providerName?: string | null;
  humanitarianOrgName?: string | null;
  parkingServiceName?: string | null;
};

// ... ostali tipovi