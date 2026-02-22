// lib/rate-limit.ts
// Rate limiting pomoću Upstash Redis koji već postoji u projektu
// Instalacija: npm install @upstash/ratelimit @upstash/redis

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

// ============================================================
// INICIJALIZACIJA REDIS KLIJENTA
// ============================================================
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

// ============================================================
// RAZLIČITI LIMITERI ZA RAZLIČITE RUTE
// ============================================================

// Login — strogi limit (5 pokušaja / 15 minuta)
export const authRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  analytics: true,
  prefix: "ratelimit:auth",
});

// Generalni API — umereni limit (100 req / 1 minuta)
export const apiRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"),
  analytics: true,
  prefix: "ratelimit:api",
});

// File upload — restriktivno (10 upload-a / 10 minuta)
export const uploadRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10 m"),
  analytics: true,
  prefix: "ratelimit:upload",
});

// Email slanje — veoma restriktivno (3 / sat)
export const emailRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "1 h"),
  analytics: true,
  prefix: "ratelimit:email",
});

// Cron job zaštita (1 poziv / minuta po endpointu)
export const cronRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1, "1 m"),
  analytics: true,
  prefix: "ratelimit:cron",
});

// ============================================================
// HELPER FUNKCIJA — koristi u API rutama i Server Actions
// ============================================================

type RateLimitResult = {
  success: boolean;
  response?: NextResponse;
};

/**
 * Proverava rate limit i vraća error response ako je prekoračen.
 *
 * @example
 * // U API ruti:
 * const { success, response } = await checkRateLimit(request, authRatelimit);
 * if (!success) return response;
 *
 * @example
 * // Koristi IP ili userId kao identifikator
 * const identifier = session?.user?.id || getIP(request);
 */
export async function checkRateLimit(
  request: NextRequest,
  limiter: Ratelimit,
  customIdentifier?: string
): Promise<RateLimitResult> {
  const identifier =
    customIdentifier ||
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "anonymous";

  const { success, limit, reset, remaining } =
    await limiter.limit(identifier);

  if (!success) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: "Previše zahteva. Pokušajte ponovo za kratko vreme.",
          retryAfter: Math.ceil((reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": new Date(reset).toISOString(),
            "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        }
      ),
    };
  }

  return { success: true };
}

// ============================================================
// MIDDLEWARE HELPER — dodaje rate limit headers u svaki response
// ============================================================
export function addRateLimitHeaders(
  response: NextResponse,
  limit: number,
  remaining: number,
  reset: number
): NextResponse {
  response.headers.set("X-RateLimit-Limit", limit.toString());
  response.headers.set("X-RateLimit-Remaining", remaining.toString());
  response.headers.set("X-RateLimit-Reset", new Date(reset).toISOString());
  return response;
}