// app/api/providers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// ✅ Cached funkcija za fetching providers
const getCachedProviders = unstable_cache(
  async (
    page: number,
    limit: number,
    search: string | null,
    isActiveParam: string | null,
    hasContracts: boolean,
    sortBy: string,
    sortDirection: string
  ) => {
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (isActiveParam !== null) {
      where.isActive = isActiveParam === 'true';
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (hasContracts) {
      where.contracts = { some: {} };
    }

    console.log('🔍 Fetching providers from database...');

    // Fetch providers with pagination
    const [providers, total] = await Promise.all([
      prisma.provider.findMany({
        where,
        select: {
          id: true,
          name: true,
          contactName: true,
          email: true,
          phone: true,
          address: true,
          isActive: true,
          imageUrl: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              contracts: true,
              vasServices: true,
              bulkServices: true,
            }
          }
        },
        orderBy: {
          [sortBy]: sortDirection
        },
        skip,
        take: limit,
      }),
      prisma.provider.count({ where })
    ]);

    return { providers, total };
  },
  ['providers-api'],
  { 
    revalidate: 60,
  }
);

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);

    // Filter parameters
    const search = searchParams.get('search');
    const isActiveParam = searchParams.get('isActive');
    const hasContracts = searchParams.get('hasContracts') === 'true';
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortDirection = searchParams.get('sortDirection') || 'asc';

    // ✅ Koristi cached funkciju
    const { providers, total } = await getCachedProviders(
      page,
      limit,
      search,
      isActiveParam,
      hasContracts,
      sortBy,
      sortDirection
    );

    return NextResponse.json({
      items: providers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
    
  } catch (error) {
    console.error('[PROVIDERS_GET_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check permissions
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Provider name is required' },
        { status: 400 }
      );
    }

    // Check if provider exists
    const existingProvider = await prisma.provider.findFirst({
      where: { 
        name: {
          equals: body.name,
          mode: 'insensitive'
        }
      }
    });

    if (existingProvider) {
      return NextResponse.json(
        { error: 'Provider with this name already exists' },
        { status: 409 }
      );
    }

    // Create new provider
    const provider = await prisma.provider.create({
      data: {
        name: body.name,
        contactName: body.contactName,
        email: body.email,
        phone: body.phone,
        address: body.address,
        isActive: body.isActive ?? true,
        imageUrl: body.imageUrl,
      },
      select: {
        id: true,
        name: true,
        contactName: true,
        email: true,
        phone: true,
        address: true,
        isActive: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    // ✅ Invaliduj cache posle create
    revalidatePath('/providers');
    revalidatePath('/api/providers');

    return NextResponse.json(provider, { status: 201 });
    
  } catch (error) {
    console.error('[PROVIDER_CREATE_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}