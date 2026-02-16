import { cacheTag, cacheLife } from 'next/cache';
import { db } from '@/lib/db';
import { CACHE_TAGS } from '@/lib/cache/config';

/**
 * Fetch svih parking servisa
 */
export async function getParkingServices() {
  'use cache';
  cacheLife('rare');
  cacheTag(CACHE_TAGS.PARKING_SERVICES, CACHE_TAGS.PARKING_SERVICES_LIST);

  try {
    const services = await db.parkingService.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return services;
  } catch (error) {
    console.error('[PARKING_SERVICES_FETCH_ERROR]', error);
    throw new Error('Failed to fetch parking services');
  }
}

/**
 * Fetch aktivnih parking servisa (za forme)
 */
export async function getActiveParkingServices() {
  'use cache';
  cacheLife('rare');
  cacheTag(CACHE_TAGS.PARKING_SERVICES, CACHE_TAGS.PARKING_SERVICES_LIST);

  try {
    const services = await db.parkingService.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
      },
    });

    return services;
  } catch (error) {
    console.error('[ACTIVE_PARKING_SERVICES_FETCH_ERROR]', error);
    return [];
  }
}

/**
 * Fetch pojedinačnog parking servisa
 */
export async function getParkingServiceById(id: string) {
  'use cache';
  cacheLife('default');
  cacheTag(
    CACHE_TAGS.PARKING_SERVICES,
    CACHE_TAGS.PARKING_SERVICE_DETAILS,
    `parking-service-${id}`
  );

  try {
    const service = await db.parkingService.findUnique({
      where: { id },
      include: {
        contracts: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!service) {
      throw new Error('Parking service not found');
    }

    return service;
  } catch (error) {
    console.error('[PARKING_SERVICE_FETCH_ERROR]', error);
    throw error;
  }
}