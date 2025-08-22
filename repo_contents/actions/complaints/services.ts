///actions/complaints/services.ts

"use server";

import { db } from "@/lib/db";

interface ServiceData {
  id: string;
  name: string;
  type: string;
}

export async function getServicesByProviderId(providerId: string | null): Promise<ServiceData[]> {
  if (!providerId) {
    console.log("No providerId provided to getServicesByProviderId");
    return [];
  }

  try {
    const services = await db.service.findMany({
        where: {
            OR: [
                {
                    vasServices: {
                        some: {
                            provajderId: providerId
                        }
                    }
                },
                {
                    bulkServices: {
                        some: {
                            providerId: providerId
                        }
                    }
                }
            ]
        },
        select: {
            id: true,
            name: true,
            type: true,
        },
        orderBy: { name: 'asc' },
    });

    console.log(`Workspaceed ${services.length} services for provider ${providerId}`);
    return services;

  } catch (error) {
    console.error(`Error fetching services for provider ${providerId}:`, error);
    return [];
  }
}