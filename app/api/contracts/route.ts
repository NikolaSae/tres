// /app/api/contracts/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ContractStatus, ContractType, Prisma } from '@prisma/client';
import { addDays } from 'date-fns';

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class CacheManager {
  private static instance: CacheManager;
  private cache = new Map<string, CacheEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startCleanup();
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  private startCleanup() {
    if (this.cleanupInterval) return;
    
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.cache.entries()) {
        if (now - value.timestamp > value.ttl) {
          this.cache.delete(key);
        }
      }
    }, 60000);

    const cleanup = () => {
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
        this.cleanupInterval = null;
      }
    };

    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);
    process.on('SIGUSR2', cleanup);
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    return null;
  }

  set(key: string, data: any, ttlMs: number = 30000): void {
    this.cache.set(key, { data, timestamp: Date.now(), ttl: ttlMs });
  }

  clear(): void {
    this.cache.clear();
  }
}

const cacheManager = CacheManager.getInstance();

const validateQueryParams = (searchParams: URLSearchParams) => {
  const errors: string[] = [];
  
  const type = searchParams.get('type');
  if (type && !Object.values(ContractType).includes(type as ContractType)) {
    errors.push('Invalid contract type');
  }

  const status = searchParams.get('status');
  if (status && !Object.values(ContractStatus).includes(status as ContractStatus)) {
    errors.push('Invalid contract status');
  }

  const page = searchParams.get('page');
  if (page && (isNaN(parseInt(page)) || parseInt(page) < 1)) {
    errors.push('Page must be a positive number');
  }

  const limit = searchParams.get('limit');
  if (limit && (isNaN(parseInt(limit)) || parseInt(limit) < 1 || parseInt(limit) > 1000)) {
    errors.push('Limit must be between 1 and 1000');
  }

  const expiringWithin = searchParams.get('expiringWithin');
  if (expiringWithin && (isNaN(parseInt(expiringWithin)) || parseInt(expiringWithin) < 0)) {
    errors.push('ExpiringWithin must be a non-negative number');
  }

  return errors;
};

export async function GET(request: NextRequest) {
  console.log('Starting GET request for contracts');
  
  try {
    const { searchParams } = request.nextUrl;
    console.log('Request query parameters:', Object.fromEntries(searchParams.entries()));

    const validationErrors = validateQueryParams(searchParams);
    if (validationErrors.length > 0) {
      console.error('Validation errors:', validationErrors);
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }

    const type = searchParams.get('type') as ContractType | null;
    const status = searchParams.get('status') as ContractStatus | null;
    const providerId = searchParams.get('providerId');
    const humanitarianOrgId = searchParams.get('humanitarianOrgId');
    const parkingServiceId = searchParams.get('parkingServiceId');
    const search = searchParams.get('search');
    const expiringWithin = searchParams.get('expiringWithin');
    const includeExpired = searchParams.get('includeExpired') === 'true';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(1000, Math.max(1, parseInt(searchParams.get('limit') || '25')));

    const cacheKey = searchParams.toString();
    
    if (!search && !expiringWithin) {
      const cachedResult = cacheManager.get(cacheKey);
      if (cachedResult) {
        console.log('Returning cached result for key:', cacheKey);
        return NextResponse.json(cachedResult, { 
          status: 200,
          headers: { 'X-Cache': 'HIT' }
        });
      }
    }

    const conditions: Prisma.ContractWhereInput[] = [];

    if (type) conditions.push({ type });
    if (status) conditions.push({ status });
    if (providerId) conditions.push({ providerId });
    if (humanitarianOrgId) conditions.push({ humanitarianOrgId });
    if (parkingServiceId) conditions.push({ parkingServiceId });

    if (search && search.trim()) {
      const searchTerm = search.trim();
      conditions.push({
        OR: [
          { name: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
          { contractNumber: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
          { description: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
          { provider: { name: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } } },
          { humanitarianOrg: { name: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } } },
          { parkingService: { name: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } } },
        ]
      });
    }

    if (expiringWithin) {
      const days = parseInt(expiringWithin, 10);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const futureDate = addDays(today, days);
      const pastDate = addDays(today, -days);

      const expiringConditions: Prisma.ContractWhereInput[] = [
        // Contracts expiring in the next X days
        {
          endDate: {
            gte: today,
            lte: futureDate,
          }
        }
      ];

      // Contracts expired in the last X days (only if includeExpired is true)
      if (includeExpired) {
        expiringConditions.push({
          endDate: {
            gte: pastDate,
            lt: today,
          }
        });
      }

      conditions.push({
        OR: expiringConditions
      });
    }

    const where: Prisma.ContractWhereInput = conditions.length > 0 ? { AND: conditions } : {};
    const skip = (page - 1) * limit;

    console.log('Executing database query with where clause:', JSON.stringify(where, null, 2));
    
    const [contracts, totalCount] = await Promise.all([
      db.contract.findMany({
        where,
        include: {
          provider: { select: { id: true, name: true } },
          humanitarianOrg: { select: { id: true, name: true } },
          parkingService: { select: { id: true, name: true } },
          services: {
            select: {
              id: true,
              contractId: true,
              serviceId: true,
              specificTerms: true,
              service: { select: { id: true, name: true, type: true } }
            }
          },
          _count: { select: { services: true, attachments: true, reminders: true } }
        },
        orderBy: [{ status: "asc" }, { endDate: "asc" }, { updatedAt: "desc" }],
        skip,
        take: limit
      }),
      db.contract.count({ where })
    ]);

    console.log(`Found ${contracts.length} contracts out of ${totalCount} total`);

    const totalPages = Math.ceil(totalCount / limit);

    const result = {
      contracts,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      },
      metadata: {
        serverTime: new Date().toISOString(),
        cached: false
      }
    };

    if (!search && !expiringWithin) {
      cacheManager.set(cacheKey, result);
      console.log('Cached result for key:', cacheKey);
    }

    return NextResponse.json(result, {
      status: 200,
      headers: { 'X-Cache': 'MISS' }
    });

  } catch (error) {
    console.error('Error in GET /api/contracts:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to fetch contracts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  console.log('Starting POST request for contracts');
  
  try {
    const body = await request.json();
    
    if (!body.name || !body.contractNumber || !body.type) {
      console.error('Missing required fields in request body');
      return NextResponse.json(
        { error: 'Missing required fields: name, contractNumber, type' },
        { status: 400 }
      );
    }

    cacheManager.clear();
    console.log('Cleared cache due to new contract creation');

    return NextResponse.json(
      { message: 'Contract created successfully' },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error in POST /api/contracts:', error);
    return NextResponse.json(
      { error: 'Failed to create contract' },
      { status: 500 }
    );
  }
}