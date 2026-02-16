import { cacheTag, cacheLife } from 'next/cache';
import { db } from '@/lib/db';
import { CACHE_TAGS } from '@/lib/cache/config';

/**
 * Next.js 16: Fetch svih providera
 */
export async function getProviders() {
  'use cache';
  cacheLife('rare');
  cacheTag(CACHE_TAGS.PROVIDERS, CACHE_TAGS.PROVIDERS_LIST);

  try {
    const providers = await db.provider.findMany({
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

    return providers;
  } catch (error) {
    console.error('[PROVIDERS_FETCH_ERROR]', error);
    throw new Error('Failed to fetch providers');
  }
}

/**
 * Fetch aktivnih providera (za forme)
 */
export async function getActiveProviders() {
  'use cache';
  cacheLife('rare');
  cacheTag(CACHE_TAGS.PROVIDERS, CACHE_TAGS.PROVIDERS_LIST);

  try {
    const providers = await db.provider.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
      },
    });

    return providers;
  } catch (error) {
    console.error('[ACTIVE_PROVIDERS_FETCH_ERROR]', error);
    return [];
  }
}

/**
 * Fetch pojedinačnog providera
 */
export async function getProviderById(id: string) {
  'use cache';
  cacheLife('default');
  cacheTag(CACHE_TAGS.PROVIDERS, CACHE_TAGS.PROVIDER_DETAILS, `provider-${id}`);

  try {
    const provider = await db.provider.findUnique({
      where: { id },
      include: {
        contracts: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        bulkServices: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        vasServices: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!provider) {
      throw new Error('Provider not found');
    }

    return provider;
  } catch (error) {
    console.error('[PROVIDER_FETCH_ERROR]', error);
    throw error;
  }
}

/**
 * Count ukupno providera
 */
export async function getProvidersCount() {
  'use cache';
  cacheLife('rare');
  cacheTag(CACHE_TAGS.PROVIDERS);

  try {
    return await db.provider.count();
  } catch (error) {
    console.error('[PROVIDERS_COUNT_ERROR]', error);
    return 0;
  }
}