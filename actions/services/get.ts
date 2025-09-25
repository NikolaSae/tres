// /actions/services/get.ts
'use server';

import { db } from '@/lib/db';
import { ServiceType } from '@prisma/client';
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


export async function getServices(): Promise<{ data?: Service[]; error?: string }> {
     try {
         const services = await db.service.findMany({
             orderBy: { name: 'asc' },

         });

         return { data: services as Service[] };

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
        // console.error(`Error fetching services by types ${types.join(', ')}:`, error);
        return { error: 'Failed to fetch services by type.' };
    }
}