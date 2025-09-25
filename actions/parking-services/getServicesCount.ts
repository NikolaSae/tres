//actions/parking-services/getServicesCount.ts

'use server';
import { db } from '@/lib/db';

export async function getServicesCountForParkingService(parkingServiceId: string) {
  try {
    // Alternativni pristup - prvo nalazimo jedinstvene service ID-jeve
    const contracts = await db.contract.findMany({
      where: {
        parkingServiceId: parkingServiceId
      },
      select: {
        services: {
          select: {
            serviceId: true
          }
        }
      }
    });
    
    // Izvlačimo jedinstvene service ID-jeve
    const serviceIds = new Set();
    contracts.forEach(contract => {
      contract.services.forEach(service => {
        serviceIds.add(service.serviceId);
      });
    });
    
    return serviceIds.size;
  } catch (error) {
    console.error('Error fetching services count:', error);
    return 0;
  }
}