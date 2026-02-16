// lib/cache/memory-cache.ts
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();

  set<T>(key: string, data: T, ttl: number = 60): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl * 1000, // convert to milliseconds
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    // Delete keys matching pattern
    const regex = new RegExp(pattern.replace(/\*/g, ".*"));
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  // Periodic cleanup of expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache stats (useful for monitoring)
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export const memoryCache = new MemoryCache();

// Cleanup every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    memoryCache.cleanup();
    console.log("[MEMORY_CACHE] Cleanup completed. Current size:", memoryCache.getStats().size);
  }, 5 * 60 * 1000);
}

// Helper function
export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 60
): Promise<T> {
  const cached = memoryCache.get<T>(key);
  
  if (cached !== null) {
    console.log(`[CACHE HIT] ${key}`);
    return cached;
  }

  console.log(`[CACHE MISS] ${key}`);
  const data = await fetcher();
  memoryCache.set(key, data, ttl);
  
  return data;
}

export function invalidateCache(pattern: string): void {
  console.log(`[CACHE INVALIDATED] ${pattern}`);
  memoryCache.clear(pattern);
}