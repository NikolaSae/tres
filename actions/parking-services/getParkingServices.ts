// actions/parking-services/getParkingServices.ts
'use server';

import { db } from '@/lib/db';

interface GetParkingServicesParams {
  searchTerm?: string;
  isActive?: boolean;
  serviceNumber?: string;
  hasContracts?: boolean;
  page: number;
  pageSize: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export async function getParkingServices(params: GetParkingServicesParams) {
  try {
    const { searchTerm, isActive, page, pageSize, sortBy, sortDirection } = params;

    // Build where clause
    const where: any = {};

    if (searchTerm) {
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortDirection || 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }

    // Get total count
    const totalCount = await db.parkingService.count({ where });

    // Get paginated results with related services
    const parkingServices = await db.parkingService.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        transactions: {
          select: {
            service: {
              select: {
                id: true,
                name: true,
                type: true,
              }
            }
          },
          distinct: ['serviceId'],
        },
        _count: {
          select: {
            contracts: true,
            transactions: true,
          }
        }
      },
    });

    // Transform data to include unique services
    const transformedServices = parkingServices.map(ps => {
      // Get unique services from transactions
      const uniqueServices = Array.from(
        new Map(
          ps.transactions
            .filter(t => t.service)
            .map(t => [t.service.id, t.service])
        ).values()
      );

      return {
        id: ps.id,
        name: ps.name,
        description: ps.description,
        contactName: ps.contactName,
        email: ps.email,
        phone: ps.phone,
        address: ps.address,
        additionalEmails: ps.additionalEmails,
        isActive: ps.isActive,
        createdAt: ps.createdAt,
        updatedAt: ps.updatedAt,
        lastReportSentAt: ps.lastReportSentAt,
        totalReportsSent: ps.totalReportsSent,
        contractCount: ps._count.contracts,
        transactionCount: ps._count.transactions,
        services: uniqueServices,
      };
    });

    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      success: true,
      data: {
        parkingServices: transformedServices,
        totalCount,
        page,
        pageSize,
        totalPages,
      },
    };
  } catch (error) {
    console.error('Error fetching parking services:', error);
    return {
      success: false,
      error: 'Failed to fetch parking services. Please try again.',
      data: null,
    };
  }
}