// actions/providers/get.ts
'use server';

import db from '@/lib/db';
import { auth } from '@/auth';
import { currentRole } from '@/lib/auth';
import { UserRole } from '@prisma/client';
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
    if (![UserRole.ADMIN, UserRole.MANAGER].includes(role!)) {
      return {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        error: "Forbidden: You don't have permission to access this resource"
      };
    }
    const { page = 1, limit = 10, ...filters } = params;
    
    // Build where clause
    const where = {
      AND: [
        filters.search && {
          OR: [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { contactName: { contains: filters.search, mode: 'insensitive' } },
            { email: { contains: filters.search, mode: 'insensitive' } }
          ]
        },
        filters.isActive !== undefined && { isActive: filters.isActive },
        filters.hasContracts && { contracts: { some: {} } },
        filters.hasComplaints && { complaints: { some: {} } }
      ].filter(Boolean)
    };

    // Handle sorting
    const orderBy = filters.sortBy ? {
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