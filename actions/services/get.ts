// /actions/services/get.ts
'use server';

import { db } from '@/lib/db';
import { ServiceType, Prisma } from '@prisma/client';
import { Service } from '@/lib/types/service-types';

export async function getServiceById(id: string): Promise<{ data?: Service; error?: string }> {
    if (!id) {
        return { error: 'Service ID is required.' };
    }

    try {
        const service = await db.service.findUnique({
            where: { id },
        });

        if (!service) {
            return { error: 'Service not found.' };
        }

        return { data: service as Service };

    } catch (error) {
        console.error(`Error fetching service ${id}:`, error);
        return { error: 'Failed to fetch service.' };
    }
}

export async function getServices(params?: {
    search?: string;
    type?: ServiceType;
    isActive?: boolean;
    page?: number;
    limit?: number;
}): Promise<{ data?: Service[]; total?: number; error?: string }> {
    try {
        const { search, type, isActive, page = 1, limit = 10 } = params || {};

        // Build where clause
        const where: Prisma.ServiceWhereInput = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (type) {
            where.type = type;
        }

        if (isActive !== undefined) {
            where.isActive = isActive;
        }

        // Fetch services with pagination
        const [services, total] = await Promise.all([
            db.service.findMany({
                where,
                orderBy: { name: 'asc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            db.service.count({ where }),
        ]);

        return { data: services as Service[], total };

    } catch (error) {
        console.error("Error fetching services:", error);
        return { error: 'Failed to fetch services.' };
    }
}

export async function getServicesByType(types: ServiceType[]): Promise<{ data?: Service[]; error?: string }> {
    if (!types || types.length === 0) {
        return { data: [] };
    }

    try {
        const services = await db.service.findMany({
            where: {
                type: {
                    in: types,
                },
            },
            orderBy: { name: 'asc' },
        });

        return { data: services as Service[] };

    } catch (error) {
        return { error: 'Failed to fetch services by type.' };
    }
}