// /lib/security/rate-limiter.ts
import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

type RateLimitConfig = {
  maxRequests: number;  // Maximum requests in window
  window: number;       // Time window in seconds
}

const defaultConfig: RateLimitConfig = {
  maxRequests: 60,      // 60 requests
  window: 60,          // per minute
}

export async function rateLimit(
  req: NextRequest, 
  identifier: string, 
  config: RateLimitConfig = defaultConfig
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  // Get IP from headers since req.ip doesn't exist in Next.js 13+
  const ip = req.headers.get('x-forwarded-for') || 
             req.headers.get('x-real-ip') || 
             identifier || 
             'anonymous';
  
  const key = `ratelimit:${identifier}:${ip}`;
  
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - (now % config.window);
  const windowExpiry = windowStart + config.window;
  
  const result = await redis.pipeline()
    .incr(key)
    .expire(key, config.window)
    .exec();
    
  const currentCount = result[0] as number;
    
  return {
    success: currentCount <= config.maxRequests,
    limit: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - currentCount),
    reset: windowExpiry,
  };
}

export const rateLimiter = { check: rateLimit, rateLimit };