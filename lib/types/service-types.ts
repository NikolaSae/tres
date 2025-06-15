// /lib/types/service-types.ts
import { Service, ServiceType as PrismaServiceType, Provider } from '@prisma/client';

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
    type?: ServiceType;
    isActive?: boolean;
}

export interface ServicesApiResponse {
    services: ServiceWithDetails[];
    totalCount: number;
}