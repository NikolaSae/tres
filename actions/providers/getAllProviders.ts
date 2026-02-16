// /actions/providers/getAllProviders.ts
"use server";

import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db';
import { auth } from '@/auth';

interface GetAllProvidersFilters {
  isActive?: boolean;
}

// ✅ Cached funkcija za sve providere
const getCachedAllProviders = unstable_cache(
  async (isActive?: boolean) => {
    console.log('🔍 Fetching all providers from database');
    
    const where: any = {};
    
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return db.provider.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  },
  ['all-providers'],
  { revalidate: 60 } // 1 minut cache
);

/**
 * Server-side funkcija za dohvatanje liste provajdera iz baze podataka.
 * Može opcionalno filtrirati rezultate.
 */
export async function getAllProviders(filters?: GetAllProvidersFilters) {
  try {
    // ✅ Auth check
    const session = await auth();
    
    if (!session?.user) {
      throw new Error("Unauthorized access");
    }

    // ✅ Cached DB query
    return await getCachedAllProviders(filters?.isActive);
    
  } catch (error) {
    console.error('[GET_ALL_PROVIDERS_ERROR]', error);
    return [];
  }
}