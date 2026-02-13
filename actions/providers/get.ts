// actions/providers/get.ts
'use server';

import { db } from '@/lib/db';
import { auth } from '@/auth';
import { currentRole } from '@/lib/auth';
import { UserRole, Prisma } from '@prisma/client';
import { ProviderWithCounts, ProviderFilterOptions } from '@/lib/types/provider-types';

export async function getProviders(params: ProviderFilterOptions & {
  page?: number;
  limit?: number;
}) {
  try {
    const session = await auth();
    if (!session?.user) {
      return {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        error: "Unauthorized: Please login to access this resource"
      };
    }

    // Provera uloge
    const role = await currentRole();
    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.MANAGER];
    if (!role || !allowedRoles.includes(role)) {
      return {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        error: "Forbidden: You don't have permission to access this resource"
      };
    }

    const { page = 1, limit = 10, ...filters } = params;
    
    // Build where clause with proper typing
    const whereConditions: Prisma.ProviderWhereInput[] = [];

    if (filters.search) {
      whereConditions.push({
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { contactName: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } }
        ]
      });
    }

    if (filters.isActive !== undefined) {
      whereConditions.push({ isActive: filters.isActive });
    }

    if (filters.hasContracts) {
      whereConditions.push({ contracts: { some: {} } });
    }

    if (filters.hasComplaints) {
      whereConditions.push({ complaints: { some: {} } });
    }

    const where: Prisma.ProviderWhereInput = whereConditions.length > 0 
      ? { AND: whereConditions }
      : {};

    // Handle sorting
    const orderBy: Prisma.ProviderOrderByWithRelationInput | undefined = filters.sortBy ? {
      [filters.sortBy]: filters.sortDirection || 'asc'
    } : undefined;

    const [providers, total] = await Promise.all([
      db.provider.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy,
        include: {
          _count: {
            select: {
              contracts: true,
              complaints: true
            }
          }
        }
      }),
      db.provider.count({ where })
    ]);

    return {
      data: providers as ProviderWithCounts[],
      total,
      page,
      limit,
      error: null
    };

  } catch (error) {
    console.error("Database Error:", error);
    return {
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      error: "Failed to fetch providers"
    };
  }
}