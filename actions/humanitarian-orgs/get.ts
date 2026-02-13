// actions/humanitarian-orgs/get.ts

'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Prisma } from '@prisma/client';

interface GetHumanitarianOrgsParams {
  search?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortDirection?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  includeRenewals?: boolean;
}

export async function getHumanitarianOrgs(params: GetHumanitarianOrgsParams = {}) {
  try {
    const session = await auth();
    
    if (!session) {
      throw new Error('Unauthorized');
    }

    const {
      search,
      isActive,
      sortBy = 'name',
      sortDirection = 'asc',
      page = 1,
      limit = 10,
      includeRenewals = false
    } = params;

    // Build where clause
    const where: Prisma.HumanitarianOrgWhereInput = {
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { contactName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ]
      })
    };

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count
    const totalCount = await prisma.humanitarianOrg.count({ where });

    // Get organizations
    const orgs = await prisma.humanitarianOrg.findMany({
      where,
      select: {
        id: true,
        name: true,
        contactName: true,
        email: true,
        phone: true,
        address: true,
        website: true,
        mission: true,
        pib: true,
        registrationNumber: true,
        bank: true,
        accountNumber: true,
        shortNumber: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        ...(includeRenewals && {
          renewals: {
            select: {
              id: true,
              renewalStartDate: true,
              proposedStartDate: true,
              proposedEndDate: true,
              subStatus: true,
              notes: true,
              createdAt: true,
              updatedAt: true,
            },
            orderBy: {
              renewalStartDate: 'desc'
            }
          }
        }),
        _count: {
          select: {
            complaints: true,
            renewals: true,
            contracts: true,
          }
        }
      },
      orderBy: {
        [sortBy]: sortDirection
      },
      skip,
      take: limit,
    });

    return {
      data: orgs,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    };
  } catch (error) {
    console.error('Error fetching humanitarian organizations:', error);
    throw error;
  }
}