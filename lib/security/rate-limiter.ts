// lib/security/rate-limiter.ts
import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

type RateLimitConfig = {
  maxRequests: number; // maksimalan broj zahteva
  window: number;      // vremenski prozor u sekundama
};

// ============================================================
// PREDEFINISANE KONFIGURACIJE
// ============================================================
export const RATE_LIMIT_CONFIGS = {
  // Login — strogo (5 pokušaja / 15 minuta)
  auth: { maxRequests: 5, window: 15 * 60 },
  // Generalni API (100 / minuta)
  api: { maxRequests: 100, window: 60 },
  // Upload fajlova (10 / 10 minuta)
  upload: { maxRequests: 10, window: 10 * 60 },
  // Email slanje (3 / sat)
  email: { maxRequests: 3, window: 60 * 60 },
  // Cron (1 / minuta)
  cron: { maxRequests: 1, window: 60 },
  // Default
  default: { maxRequests: 60, window: 60 },
} satisfies Record<string, RateLimitConfig>;

// ============================================================
// BUG FIX: Stari kod koristio expire(key, config.window) što
// resetuje TTL na svaki request — window se nikad ne zatvara.
// Ispravka: koristimo fixed window sa NX (set only if not exists)
// ============================================================
export async function rateLimit(
  req: NextRequest,
  identifier: string,
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.default
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    identifier ||
    "anonymous";

  const now = Math.floor(Date.now() / 1000);
  // Fixed window — zaokružuje na početak trenutnog prozora
  const windowStart = now - (now % config.window);
  const windowExpiry = windowStart + config.window;
  const key = `ratelimit:${identifier}:${ip}:${windowStart}`;

  const result = await redis
    .pipeline()
    .incr(key)
    // ISPRAVKA: expireAt postavlja apsolutno vreme isteka prozora
    // umesto expire() koji resetuje TTL na svaki poziv
    .expireat(key, windowExpiry)
    .exec();

  const currentCount = result[0] as number;

  return {
    success: currentCount <= config.maxRequests,
    limit: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - currentCount),
    reset: windowExpiry,
  };
}

// ============================================================
// HELPER — koristi direktno u API route handlerima
// Vraća NextResponse 429 ako je limit prekoračen, null ako je ok
// ============================================================
export async function checkRateLimit(
  req: NextRequest,
  identifier: string,
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.default
): Promise<NextResponse | null> {
  const result = await rateLimit(req, identifier, config);

  if (!result.success) {
    return NextResponse.json(
      {
        error: "Previše zahteva. Pokušajte ponovo za kratko vreme.",
        retryAfter: result.reset - Math.floor(Date.now() / 1000),
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": result.limit.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": new Date(result.reset * 1000).toISOString(),
          "Retry-After": (result.reset - Math.floor(Date.now() / 1000)).toString(),
        },
      }
    );
  }

  return null; // ok, nastavi
}

export const rateLimiter = { check: rateLimit, rateLimit };