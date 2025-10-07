// lib/mcp/read-operations.ts
import { db } from '@/lib/db';
import { McpContext, McpResult } from './types';

/**
 * READ operacije - Čitanje podataka iz baze
 */
export class ReadOperations {
  /**
   * Dohvaća ugovore sa filterima
   */
  async getContracts(args: any, context: McpContext): Promise<McpResult> {
    try {
      const where: any = {};

      if (args.status) where.status = args.status;
      if (args.type) where.type = args.type;

      // USER može videti samo svoje ugovore
      if (context.userRole === 'USER') {
        where.createdById = context.userId;
      }

      let orderBy: any = { updatedAt: 'desc' };
      if (args.orderBy) orderBy = args.orderBy;

      const totalCount = await db.contract.count({ where });

      const contracts = await db.contract.findMany({
        where,
        include: {
          provider: { select: { name: true, id: true } },
          humanitarianOrg: { select: { name: true, id: true } },
          parkingService: { select: { name: true, id: true } },
          createdBy: { select: { name: true, email: true } },
          _count: {
            select: {
              services: true,
              attachments: true,
              renewals: true,
            },
          },
        },
        take: args.limit || 10,
        skip: Math.max(0, args.offset || 0),
        orderBy,
      });

      return {
        success: true,
        data: {
          contracts,
          total: totalCount,
          displayed: contracts.length,
          summary: {
            active: await db.contract.count({ where: { ...where, status: 'ACTIVE' } }),
            expired: await db.contract.count({ where: { ...where, status: 'EXPIRED' } }),
            pending: await db.contract.count({ where: { ...where, status: 'PENDING' } }),
          },
        },
        metadata: { recordsAffected: contracts.length },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get contracts: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Pretraga entiteta kroz više tabela
   */
  async searchEntities(args: any, context: McpContext): Promise<McpResult> {
    if (!['ADMIN', 'MANAGER'].includes(context.userRole)) {
      return { success: false, error: 'Insufficient permissions' };
    }

    try {
      const searchQuery = args.query;
      const entities = args.entities || ['contracts', 'providers', 'complaints', 'humanitarian_orgs'];
      const limit = args.limit || 20;
      const offset = args.offset || 0;
      const results: any = {};

      const limitPerEntity = Math.floor(limit / entities.length);

      if (entities.includes('contracts')) {
        results.contracts = await db.contract.findMany({
          where: {
            OR: [
              { name: { contains: searchQuery, mode: 'insensitive' } },
              { contractNumber: { contains: searchQuery, mode: 'insensitive' } },
              { description: { contains: searchQuery, mode: 'insensitive' } },
            ],
          },
          take: limitPerEntity,
          skip: Math.floor(offset / entities.length),
          select: {
            id: true,
            name: true,
            contractNumber: true,
            type: true,
            status: true,
            startDate: true,
            endDate: true,
          },
          orderBy: { updatedAt: 'desc' },
        });

        results.contractsTotal = await db.contract.count({
          where: {
            OR: [
              { name: { contains: searchQuery, mode: 'insensitive' } },
              { contractNumber: { contains: searchQuery, mode: 'insensitive' } },
              { description: { contains: searchQuery, mode: 'insensitive' } },
            ],
          },
        });
      }

      if (entities.includes('providers')) {
        results.providers = await db.provider.findMany({
          where: {
            OR: [
              { name: { contains: searchQuery, mode: 'insensitive' } },
              { contactName: { contains: searchQuery, mode: 'insensitive' } },
              { email: { contains: searchQuery, mode: 'insensitive' } },
            ],
          },
          take: limitPerEntity,
          skip: Math.floor(offset / entities.length),
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isActive: true,
            contactName: true,
          },
          orderBy: { name: 'asc' },
        });

        // ostaje kako si rekao:
        results.humanitarianOrgsTotal = await db.humanitarianOrg.count({
          where: args.onlyWithShortNumbers
            ? { shortNumber: { not: null } }
            : {
                OR: [
                  { name: { contains: searchQuery, mode: 'insensitive' } },
                  { shortNumber: { contains: searchQuery, mode: 'insensitive' } },
                ],
              },
        });
      }

      if (entities.includes('complaints')) {
        results.complaints = await db.complaint.findMany({
          where: {
            OR: [
              { title: { contains: searchQuery, mode: 'insensitive' } },
              { description: { contains: searchQuery, mode: 'insensitive' } },
            ],
          },
          take: limitPerEntity,
          skip: Math.floor(offset / entities.length),
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            createdAt: true,
            financialImpact: true,
          },
          orderBy: { createdAt: 'desc' },
        });

        results.complaintsTotal = await db.complaint.count({
          where: {
            OR: [
              { title: { contains: searchQuery, mode: 'insensitive' } },
              { description: { contains: searchQuery, mode: 'insensitive' } },
            ],
          },
        });
      }

      if (entities.includes('humanitarian_orgs') || args.onlyWithShortNumbers) {
        results.humanitarianOrgs = await db.humanitarianOrg.findMany({
          where: args.onlyWithShortNumbers
            ? { shortNumber: { not: null } }
            : {
                OR: [
                  { name: { contains: searchQuery, mode: 'insensitive' } },
                  { shortNumber: { contains: searchQuery, mode: 'insensitive' } },
                ],
              },
          take: limitPerEntity,
          skip: Math.floor(offset / entities.length),
          select: {
            id: true,
            name: true,
            shortNumber: true,
            email: true,
            phone: true,
            isActive: true,
          },
          orderBy: { name: 'asc' },
        });
      }

      return { success: true, data: results };
    } catch (error) {
      return {
        success: false,
        error: `Failed to search entities: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}

export const readOperations = new ReadOperations();
