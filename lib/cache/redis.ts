// lib/cache/redis.ts
import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Helper funkcija za cache
export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 60 // seconds
): Promise<T> {
  try {
    // Pokušaj da uzmeš iz cache-a
    const cached = await redis.get<T>(key);
    
    if (cached) {
      console.log(`[CACHE HIT] ${key}`);
      return cached;
    }

    console.log(`[CACHE MISS] ${key}`);
    // Ako nema u cache-u, dohvati iz baze
    const data = await fetcher();
    
    // Sačuvaj u cache
    await redis.setex(key, ttl, JSON.stringify(data));
    
    return data;
  } catch (error) {
    console.error(`[CACHE ERROR] ${key}:`, error);
    // Ako Redis ne radi, dohvati direktno iz baze
    return await fetcher();
  }
}

export async function invalidateCache(pattern: string) {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`[CACHE INVALIDATED] ${pattern} (${keys.length} keys)`);
    }
  } catch (error) {
    console.error(`[CACHE INVALIDATION ERROR] ${pattern}:`, error);
  }
}