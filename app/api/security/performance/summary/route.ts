// app/api/security/performance/summary/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connection } from 'next/server';
import { auth } from '@/auth';
import { rateLimiter } from '@/lib/security/rate-limiter';

export async function GET(request: NextRequest) {
  await connection();
  
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';

    const rateLimitResult = await rateLimiter.check(request, ip, {
      maxRequests: 100,
      window: 60,
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          }
        }
      );
    }

    const summary = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
      rateLimit: {
        remaining: rateLimitResult.remaining,
        limit: rateLimitResult.limit,
        reset: rateLimitResult.reset,
      }
    };

    return NextResponse.json(summary, {
      headers: {
        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.reset.toString(),
      }
    });

  } catch (error) {
    console.error('Error fetching performance summary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}