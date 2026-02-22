// /actions/providers/getAllProviders.ts
"use server";
import { connection } from 'next/server';
import { cache } from 'react'; // ← React cache umesto unstable_cache
import { db } from '@/lib/db';
import { auth } from '@/auth';

interface GetAllProvidersFilters {
  isActive?: boolean;
}

// React cache — važi samo za trajanje jednog requesta, nema headers() problem
const getCachedAllProviders = cache(async (isActive?: boolean) => {
  console.log('🔍 Fetching all providers from database');
  const where: any = {};
  if (isActive !== undefined) {
    where.isActive = isActive;
  }
  return db.provider.findMany({
    where,
    orderBy: { name: 'asc' },
  });
});

export async function getAllProviders(filters?: GetAllProvidersFilters) {
  await connection();
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Unauthorized access");
    }
    return await getCachedAllProviders(filters?.isActive);
  } catch (error) {
    console.error('[GET_ALL_PROVIDERS_ERROR]', error);
    return [];
  }
}