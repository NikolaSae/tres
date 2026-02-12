// /lib/types/service-types.ts
import { Service, ServiceType as PrismaServiceType, Provider, Prisma } from '@prisma/client';
export type { Service } from '@prisma/client';

export const ServiceType = PrismaServiceType;

export interface ServiceWithDetails extends Service {
    _count?: {
        contracts?: number;
        vasServices?: number;
        bulkServices?: number;
        complaints?: number;
    };
    // Add provider relationships
    vasServices?: {
        provider: Provider;
    }[];
    bulkServices?: {
        provider: Provider;
    }[];
}

export interface ServiceFilterOptions {
    search?: string;
    type?: PrismaServiceType;
    isActive?: boolean;
}

export interface ServicesApiResponse {
    services: ServiceWithDetails[];
    totalCount: number;
}

// BulkService with all relations
export type BulkServiceWithRelations = Prisma.BulkServiceGetPayload<{
    include: {
        provider: true;
        agreement: true;
        step: true;
        sender: true;
    };
}> & {
    // Add any computed/display fields
    service_name: string;
    agreement_name: string;
    provider_name: string;
    step_name: string;
    sender_name: string;
};

// VasService with all relations
export type VasServiceWithRelations = Prisma.VasServiceGetPayload<{
    include: {
        provider: true;
    };
}>;