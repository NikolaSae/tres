// /actions/providers/get-providers.ts
"use server";

import { unstable_cache } from 'next/cache';
import { auth } from "@/auth";
import { db } from "@/lib/db";

// ✅ Cache samo DB query, NE session check
const getCachedProvidersData = unstable_cache(
  async () => {
    console.log('🔍 Fetching providers from database...');
    
    return db.provider.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        contactName: true,
        email: true,
        phone: true,
        isActive: true,
        imageUrl: true,
        address: true,
        // ✅ Dodaj _count za sve relacije
        _count: {
          select: {
            contracts: true,
            complaints: true,
            vasServices: true,
            bulkServices: true,
          }
        }
      },
    });
  },
  ['providers-all'],
  { 
    revalidate: 60,
  }
);

// ✅ Wrapper funkcija - proveri auth PRVO, onda fetchuj cached data
export async function getProviders() {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("Unauthorized access");
  }

  // ✅ Cached DB query
  return getCachedProvidersData();
}