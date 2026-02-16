import { revalidateTag, revalidatePath } from 'next/cache';
import { CACHE_TAGS } from './config';

/**
 * Next.js 16: revalidateTag sada zahteva cache profile kao drugi argument
 * Revalidate funkcije za svaki tip podataka
 */

// ============= PROVIDERS =============
export async function revalidateProviders() {
  revalidateTag(CACHE_TAGS.PROVIDERS, 'rare');
  revalidateTag(CACHE_TAGS.PROVIDERS_LIST, 'rare');
  console.log('[CACHE] Revalidated providers');
}

export async function revalidateProvider(id: string) {
  revalidateTag(`provider-${id}`, 'default');
  revalidateTag(CACHE_TAGS.PROVIDERS, 'rare');
  revalidatePath(`/providers/${id}`);
  console.log(`[CACHE] Revalidated provider: ${id}`);
}

// ============= HUMANITARIAN ORGS =============
export async function revalidateHumanitarianOrgs() {
  revalidateTag(CACHE_TAGS.HUMANITARIAN_ORGS, 'rare');
  revalidateTag(CACHE_TAGS.HUMANITARIAN_ORGS_LIST, 'rare');
  console.log('[CACHE] Revalidated humanitarian orgs');
}

export async function revalidateHumanitarianOrg(id: string) {
  revalidateTag(`humanitarian-org-${id}`, 'default');
  revalidateTag(CACHE_TAGS.HUMANITARIAN_ORGS, 'rare');
  revalidatePath(`/humanitarian-orgs/${id}`);
  console.log(`[CACHE] Revalidated humanitarian org: ${id}`);
}

// ============= PARKING SERVICES =============
export async function revalidateParkingServices() {
  revalidateTag(CACHE_TAGS.PARKING_SERVICES, 'rare');
  revalidateTag(CACHE_TAGS.PARKING_SERVICES_LIST, 'rare');
  console.log('[CACHE] Revalidated parking services');
}

export async function revalidateParkingService(id: string) {
  revalidateTag(`parking-service-${id}`, 'default');
  revalidateTag(CACHE_TAGS.PARKING_SERVICES, 'rare');
  revalidatePath(`/parking-services/${id}`);
  console.log(`[CACHE] Revalidated parking service: ${id}`);
}

// ============= CONTRACTS =============
export async function revalidateContracts() {
  revalidateTag(CACHE_TAGS.CONTRACTS, 'frequent');
  revalidateTag(CACHE_TAGS.CONTRACTS_LIST, 'frequent');
  console.log('[CACHE] Revalidated contracts');
}

export async function revalidateContract(id: string) {
  revalidateTag(`contract-${id}`, 'frequent');
  revalidateTag(CACHE_TAGS.CONTRACTS, 'frequent');
  revalidatePath(`/contracts/${id}`);
  console.log(`[CACHE] Revalidated contract: ${id}`);
}

// ============= SERVICES =============
export async function revalidateServices() {
  revalidateTag(CACHE_TAGS.SERVICES, 'frequent');
  revalidateTag(CACHE_TAGS.SERVICES_LIST, 'frequent');
  console.log('[CACHE] Revalidated services');
}

export async function revalidateService(id: string) {
  revalidateTag(`service-${id}`, 'frequent');
  revalidateTag(CACHE_TAGS.SERVICES, 'frequent');
  revalidatePath(`/services/${id}`);
  console.log(`[CACHE] Revalidated service: ${id}`);
}

// ============= GLOBAL =============
export async function revalidateAll() {
  Object.values(CACHE_TAGS).forEach((tag) => {
    revalidateTag(tag, 'default');
  });
  console.log('[CACHE] Revalidated ALL caches');
}