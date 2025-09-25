//actions/parking-services/getServicesForParkingServiceContracts.ts

'use server';

import { db } from '@/lib/db';

export async function getServicesForParkingServiceContracts(
  parkingServiceId: string,
  showAll: boolean = false
) {
  try {
    // Fetch services with their contract count
    const services = await db.service.findMany({
      where: {
        parkingServiceId: parkingServiceId,
      },
      include: {
        _count: {
          select: {
            contracts: true
          }
        }
      }
    });

    // Filter services based on whether they're linked to contracts
    const filteredServices = showAll 
      ? services 
      : services.filter(service => service._count.contracts === 0);

    return {
      success: true,
      data: filteredServices.map(service => ({
        id: service.id,
        name: service.name,
        type: service.type,
        description: service.description,
        contractCount: service._count.contracts
      }))
    };
  } catch (error) {
    console.error('Error fetching services for parking service contracts:', error);
    return {
      success: false,
      error: 'Failed to fetch services. Please try again.',
      data: null
    };
  }
}