/**
 * Next.js 16+ Cache Configuration
 * Koristi stabilni cacheTag API
 */

export const CACHE_TAGS = {
  // Providers
  PROVIDERS: 'providers',
  PROVIDERS_LIST: 'providers-list',
  PROVIDER_DETAILS: 'provider-details',
  
  // Humanitarian Organizations
  HUMANITARIAN_ORGS: 'humanitarian-orgs',
  HUMANITARIAN_ORGS_LIST: 'humanitarian-orgs-list',
  HUMANITARIAN_ORG_DETAILS: 'humanitarian-org-details',
  
  // Parking Services
  PARKING_SERVICES: 'parking-services',
  PARKING_SERVICES_LIST: 'parking-services-list',
  PARKING_SERVICE_DETAILS: 'parking-service-details',
  
  // Contracts
  CONTRACTS: 'contracts',
  CONTRACTS_LIST: 'contracts-list',
  
  // Services
  SERVICES: 'services',
  SERVICES_LIST: 'services-list',
  
  // Other
  OPERATORS: 'operators',
  BLACKLIST: 'blacklist',
} as const;

// Next.js 16 cacheLife profiles
export const CACHE_PROFILES = {
  // Static - nikad ne expiruje osim ako ručno ne revalidiraš
  static: {
    stale: Infinity,
    revalidate: Infinity,
    expire: Infinity,
  },
  
  // Default - balans između freshness i performance
  default: {
    stale: 60, // 1 minut - koristi stale dok se ne revalidira
    revalidate: 3600, // 1 sat - revalidira u pozadini
    expire: 86400, // 24 sata - hard expiry
  },
  
  // Frequent - za podatke koji se često menjaju
  frequent: {
    stale: 30,
    revalidate: 300, // 5 minuta
    expire: 3600, // 1 sat
  },
  
  // Rare - za podatke koji se retko menjaju
  rare: {
    stale: 300, // 5 minuta
    revalidate: 7200, // 2 sata
    expire: 86400, // 24 sata
  },
} as const;

export type CacheTag = typeof CACHE_TAGS[keyof typeof CACHE_TAGS];