//actions/parking-services/getContractsCount.ts


'use server';

import { db } from '@/lib/db';

export async function getContractsCountForParkingService(parkingServiceId: string) {
  try {
    const count = await db.contract.count({
      where: {
        parkingServiceId: parkingServiceId,
      }
    });
    return count;
  } catch (error) {
    console.error('Error fetching contracts count:', error);
    return 0;
  }
}