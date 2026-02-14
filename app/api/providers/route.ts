// app/api/providers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
    
    // ✅ Pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const skip = (page - 1) * limit;

    // ✅ Filter parameters
    const search = searchParams.get('search');
    const isActiveParam = searchParams.get('isActive');
    const hasContracts = searchParams.get('hasContracts') === 'true';
    const hasComplaints = searchParams.get('hasComplaints') === 'true';
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortDirection = searchParams.get('sortDirection') || 'asc';

    // ✅ Build where clause
    const where: any = {};

    // Active status filter
    if (isActiveParam !== null) {
      where.isActive = isActiveParam === 'true';
    }

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Has contracts filter
    if (hasContracts) {
      where.contracts = {
        some: {}
      };
    }

    // Has complaints filter (if you have complaints relation)
    // if (hasComplaints) {
    //   where.complaints = {
    //     some: {}
    //   };
    // }

    // ✅ Fetch providers with pagination
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

    // ✅ Return proper format with metadata
    return NextResponse.json({
      items: providers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching providers:', error);
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

    // Check if user has permission (ADMIN or MANAGER only)
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

    // Check if provider with same name already exists
    const existingProvider = await prisma.provider.findUnique({
      where: { name: body.name }
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

    return NextResponse.json(provider, { status: 201 });
  } catch (error) {
    console.error('Error creating provider:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}