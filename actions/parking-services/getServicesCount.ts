//actions/parking-services/getServicesCount.ts

'use server';

import { db } from '@/lib/db';

export async function getServicesCountForParkingService(parkingServiceId: string) {
  try {
    const count = await db.service.count({
      where: {
        parkingServiceId: parkingServiceId,
      }
    });
    return count;
  } catch (error) {
    console.error('Error fetching services count:', error);
    return 0;
  }
}