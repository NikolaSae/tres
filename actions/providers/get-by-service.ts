// /actions/providers/get-by-service.ts
"use server";

import { unstable_cache } from 'next/cache';
import { auth } from "@/auth";
import { db } from "@/lib/db";

// ✅ Cached funkcija za provider IDs po service-u
const getCachedProviderIdsByService = unstable_cache(
  async (serviceId: string) => {
    console.log(`🔍 Fetching provider IDs for service: ${serviceId}`);
    
    const contractsWithService = await db.serviceContract.findMany({
      where: { serviceId },
      select: {
        contract: {
          select: {
            providerId: true,
          },
        },
      },
    });

    return contractsWithService
      .map(sc => sc.contract.providerId)
      .filter(Boolean) as string[];
  },
  ['provider-ids-by-service'],
  { revalidate: 300 } // 5 minuta cache
);

// ✅ Cached funkcija za sve aktivne providere
const getCachedActiveProviders = unstable_cache(
  async () => {
    console.log('🔍 Fetching all active providers');
    
    return db.provider.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        contactName: true,
        email: true,
        phone: true,
      },
    });
  },
  ['all-active-providers'],
  { revalidate: 60 } // 1 minut cache
);

// ✅ Cached funkcija za providere po ID listama
const getCachedProvidersByIds = unstable_cache(
  async (providerIds: string[]) => {
    console.log(`🔍 Fetching providers by IDs: ${providerIds.length} providers`);
    
    return db.provider.findMany({
      where: {
        id: { in: providerIds },
        isActive: true,
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        contactName: true,
        email: true,
        phone: true,
      },
    });
  },
  ['providers-by-ids'],
  { revalidate: 120 } // 2 minuta cache
);

export async function getProvidersByService(serviceId?: string) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("Unauthorized access");
  }

  // Ako nema serviceId, vrati sve aktivne providere
  if (!serviceId) {
    return getCachedActiveProviders();
  }

  // Proveri da li servis postoji (bez cachinga jer je brz upit)
  const service = await db.service.findUnique({
    where: { id: serviceId },
    select: { id: true },
  });

  if (!service) {
    throw new Error("Service not found");
  }

  // Dohvati provider IDs za ovaj servis (cached)
  const providerIds = await getCachedProviderIdsByService(serviceId);

  // Ako ima povezanih providera, vrati ih
  if (providerIds.length > 0) {
    return getCachedProvidersByIds(providerIds);
  }

  // Ako nema povezanih providera, vrati sve aktivne
  return getCachedActiveProviders();
}